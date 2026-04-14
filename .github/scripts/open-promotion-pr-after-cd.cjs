/**
 * Dernier job du CD (push sur vdev / vpreprod).
 * Après CI + CD verts, ouvre une PR de promotion en **brouillon** (Ready for review → merge),
 * sans exiger un merge GitHub préalable sur la branche de déploiement (push direct sur vdev OK).
 */
module.exports = async function openPromotionPr({ github, core, context }) {
  const { owner, repo } = context.repo;
  const mode = process.env.PROMOTION_MODE;
  const headBranch = mode;
  const shaFull = process.env.COMMIT_FULL || '';
  const cdRunId = parseInt(process.env.CD_RUN_ID || '0', 10);
  const cdHtmlUrl = process.env.CD_HTML_URL || '';
  const ciName = 'CI — Backend';
  const ciFrontendName = 'CI — Frontend';

  if (mode !== 'vdev' && mode !== 'vpreprod') {
    core.setFailed(`PROMOTION_MODE invalide : ${mode}`);
    return;
  }

  if (!shaFull || !cdRunId) {
    core.setFailed('Paramètres manquants (COMMIT_FULL ou CD_RUN_ID).');
    return;
  }

  let prBase;
  let prHead;
  let prTitle;
  let harborName;
  let mdIntro;
  let mdMergeHint;
  let cdLabel;
  if (mode === 'vdev') {
    prBase = 'vpreprod';
    prHead = 'vdev';
    prTitle = '[Promotion] vdev → vpreprod';
    harborName = '1 · Harbor — projet vdev';
    mdIntro = '## Promotion vers vpreprod';
    mdMergeHint =
      '1. Vérifier sur **vdev** si besoin.\n2. Cliquer **Ready for review** puis **Merge** → lance le CD **vpreprod**.';
    cdLabel = 'CD / vdev';
  } else {
    prBase = 'vprod';
    prHead = 'vpreprod';
    prTitle = '[Promotion] vpreprod → vprod';
    harborName = '1 · Harbor — projet vpreprod';
    mdIntro = '## Promotion vers la production (vprod)';
    mdMergeHint =
      '1. Vérifier sur **vpreprod** si besoin.\n2. Cliquer **Ready for review** puis **Merge** → lance le CD **production**.';
    cdLabel = 'CD / vpreprod';
  }

  const singlePipeline = process.env.SINGLE_PIPELINE === 'true';

  const cdRequired = singlePipeline
    ? [
        harborName,
        '2 · Registry — build & push images',
        '3 · VPS — rsync & docker compose',
      ]
    : [
        '0 · CI Backend + CI Frontend vertes sur ce commit (ou manuel)',
        harborName,
        '2 · Registry — build & push images',
        '3 · VPS — rsync & docker compose',
      ];

  async function fetchAllRunJobs(runId) {
    const jobs = [];
    for (let page = 1; page <= 15; page++) {
      const { data } = await github.rest.actions.listJobsForWorkflowRun({
        owner,
        repo,
        run_id: runId,
        per_page: 100,
        page,
      });
      jobs.push(...data.jobs);
      if (data.jobs.length < 100) break;
    }
    return jobs;
  }

  function assertJobsOk(jobs, label) {
    const bad = jobs.filter(
      (j) =>
        j.status === 'completed' &&
        j.conclusion &&
        !['success', 'skipped'].includes(j.conclusion)
    );
    if (bad.length) {
      core.setFailed(
        `${label} — échec ou annulation : ${bad.map((j) => `${j.name}=${j.conclusion}`).join(', ')}`
      );
      return false;
    }
    const pending = jobs.filter((j) => j.status !== 'completed');
    if (pending.length) {
      core.setFailed(
        `${label} — jobs non terminés : ${pending.map((j) => `${j.name}=${j.status}`).join(', ')}`
      );
      return false;
    }
    return true;
  }

  if (!singlePipeline) {
    const { data: runsPayload } = await github.rest.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      head_sha: shaFull,
      per_page: 50,
    });
    const ciSuccessRuns = (runsPayload.workflow_runs || [])
      .filter(
        (w) =>
          w.name === ciName &&
          w.head_branch === headBranch &&
          w.event === 'push' &&
          w.conclusion === 'success'
      )
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    if (ciSuccessRuns.length === 0) {
      core.setFailed(
        `Aucun run « ${ciName} » (push/${headBranch}) en succès pour ${shaFull.slice(0, 7)}.`
      );
      return;
    }
    const ciRun = ciSuccessRuns[0];
    core.info(`CI Backend : #${ciRun.id} (${ciRun.html_url})`);
    const ciJobs = await fetchAllRunJobs(ciRun.id);
    if (!assertJobsOk(ciJobs, 'CI — Backend')) return;

    const ciFrontSuccessRuns = (runsPayload.workflow_runs || [])
      .filter(
        (w) =>
          w.name === ciFrontendName &&
          w.head_branch === headBranch &&
          w.head_sha === shaFull &&
          w.conclusion === 'success'
      )
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    if (ciFrontSuccessRuns.length === 0) {
      core.setFailed(
        `Aucun run « ${ciFrontendName} » en succès pour ${shaFull.slice(0, 7)} sur ${headBranch}.`
      );
      return;
    }
    const feRun = ciFrontSuccessRuns[0];
    core.info(`CI Frontend : #${feRun.id} (${feRun.html_url})`);
    const feJobs = await fetchAllRunJobs(feRun.id);
    if (!assertJobsOk(feJobs, 'CI — Frontend')) return;
  } else {
    core.info('Pipeline unique (`needs`) : pas de vérification de runs CI séparés.');
  }

  const cdJobs = await fetchAllRunJobs(cdRunId);
  for (const name of cdRequired) {
    const j = cdJobs.find((x) => x.name === name || x.name.endsWith(name));
    if (!j) {
      core.setFailed(`Job CD introuvable : « ${name} »`);
      return;
    }
    if (j.conclusion !== 'success' && j.conclusion !== 'skipped') {
      core.setFailed(`Job CD « ${name} » : ${j.conclusion || j.status}`);
      return;
    }
    if (j.status !== 'completed') {
      core.setFailed(`Job CD « ${name} » non terminé : ${j.status}`);
      return;
    }
  }
  core.info('CI + CD (jobs 0–3) OK — création PR de promotion (brouillon).');

  try {
    await github.rest.repos.getBranch({ owner, repo, branch: prBase });
  } catch (e) {
    if (e.status !== 404) throw e;
    const { data: repoInfo } = await github.rest.repos.get({ owner, repo });
    const def = repoInfo.default_branch;
    if (def === prHead) {
      core.setFailed(`La branche « ${prBase} » n’existe pas. Créez-la sur GitHub puis relancez.`);
      return;
    }
    const { data: refData } = await github.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${def}`,
    });
    await github.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${prBase}`,
      sha: refData.object.sha,
    });
    core.info(`Branche « ${prBase} » créée (pointeur initial = « ${def} »).`);
  }

  const { data: open } = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    base: prBase,
    per_page: 100,
  });
  const existingPr = open.find((p) => p.head.ref === prHead && p.base.ref === prBase);
  if (existingPr) {
    core.info(`PR déjà ouverte (#${existingPr.number}).`);
    return;
  }

  const shaShort = shaFull.slice(0, 7);
  const body = [
    mdIntro,
    '',
    'Cette PR est en **brouillon** : ouvrez l’onglet *Pull requests*, cliquez **Ready for review**, puis **Merge** vers la branche cible.',
    '',
    mdMergeHint,
    '',
    '---',
    '',
    `**Ouverture automatique** après succès du déploiement (${cdLabel}) — pas de fusion automatique.`,
    '',
    `- Run CD : [${cdLabel}](${cdHtmlUrl})`,
    `- Commit : \`${shaShort}\``,
  ].join('\n');

  try {
    const { data: created } = await github.rest.pulls.create({
      owner,
      repo,
      head: prHead,
      base: prBase,
      title: prTitle,
      body,
      draft: true,
    });
    core.info(`PR brouillon créée : #${created.number} ${created.html_url}`);
  } catch (err) {
    if (err.status !== 422) throw err;
    const raw = err.response?.data || {};
    const msg = JSON.stringify(raw).toLowerCase();
    const errors = Array.isArray(raw.errors) ? raw.errors : [];
    const errText = errors.map((e) => e.message || e.code || '').join(' ').toLowerCase();
    const combined = `${msg} ${errText}`;
    if (combined.includes('no commits') || combined.includes('nothing to compare')) {
      core.info('Aucune PR : pas de différence entre les branches (déjà alignées).');
      return;
    }
    if (combined.includes('already exists') || combined.includes('pull request already')) {
      core.info('Une PR existe déjà pour ce couple de branches.');
      return;
    }
    core.error(`GitHub API 422 : ${JSON.stringify(raw)}`);
    throw err;
  }
};
