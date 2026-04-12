/**
 * Appelé par github-script depuis deploy-vdev / deploy-vpreprod (dernier job).
 * Ouvre une PR de promotion seulement si le commit correspond à une PR fusionnée vers la branche
 * (merge / squash / rebase). La comparaison stricte merge_commit_sha seule échoue souvent
 * (API partielle, casse, merge_commit_sha null) : on recharge la PR, on normalise les SHA, puis
 * on vérifie le message du commit (squash « (#n) », « Merge pull request #n »).
 * Enfin : liste des PR fermées vers la base avec merge_commit_sha == commit (messages personnalisés sans #).
 */
function normalizeSha(s) {
  return String(s || '').toLowerCase();
}

/** Numéro de PR GitHub dans le message de merge / squash (1ʳᵉ ligne surtout). */
function parsePrNumberFromCommitMessage(raw) {
  if (!raw) return null;
  const msg = raw.replace(/\r/g, '');
  const mergeLine = msg.match(/Merge pull request #(\d+)/);
  if (mergeLine) return parseInt(mergeLine[1], 10);
  const firstLine = (msg.split('\n')[0] || '').trim();
  const paren = firstLine.match(/\(#(\d+)\)/);
  if (paren) return parseInt(paren[1], 10);
  const endHash = firstLine.match(/\s#(\d+)\s*$/);
  if (endHash) return parseInt(endHash[1], 10);
  const anyHash = firstLine.match(/#(\d+)/);
  if (anyHash) return parseInt(anyHash[1], 10);
  return null;
}

module.exports = async function openPromotionPr({ github, core, context }) {
  const { owner, repo } = context.repo;
  const mode = process.env.PROMOTION_MODE;
  const headBranch = mode;
  const shaFull = process.env.COMMIT_FULL || '';
  const cdRunId = parseInt(process.env.CD_RUN_ID || '0', 10);
  const cdHtmlUrl = process.env.CD_HTML_URL || '';
  const ciWorkflowName = 'CI — Monorepo (server + client)';

  if (mode !== 'vdev' && mode !== 'vpreprod') {
    core.setFailed(`PROMOTION_MODE invalide : ${mode}`);
    return;
  }

  if (!shaFull || !cdRunId) {
    core.setFailed('Paramètres manquants (COMMIT_FULL ou CD_RUN_ID).');
    return;
  }

  const targetBase = mode === 'vdev' ? 'vdev' : 'vpreprod';
  const shaNorm = normalizeSha(shaFull);

  let pullsForCommit = [];
  try {
    const resp = await github.request('GET /repos/{owner}/{repo}/commits/{commit_sha}/pulls', {
      owner,
      repo,
      commit_sha: shaFull,
      headers: { accept: 'application/vnd.github+json' },
    });
    pullsForCommit = Array.isArray(resp.data) ? resp.data : [];
  } catch (e) {
    core.setFailed(
      `Impossible de vérifier les PRs liées au commit (API commits/…/pulls) : ${e.message}`
    );
    return;
  }

  const candidates = pullsForCommit.filter(
    (p) => p.merged_at && p.base && p.base.ref === targetBase
  );

  let commitMsgData = null;
  try {
    const c = await github.rest.repos.getCommit({
      owner,
      repo,
      ref: shaFull,
    });
    commitMsgData = c.data;
  } catch (e) {
    core.warning(`getCommit(${shaFull.slice(0, 7)}) : ${e.message}`);
  }
  const commitMessage = (commitMsgData?.commit?.message || '').replace(/\r/g, '');

  const mergedIntoBase = [];
  const seen = new Set();

  async function tryAcceptPr(prFull) {
    if (!prFull.merged_at || prFull.base?.ref !== targetBase) return;
    if (seen.has(prFull.number)) return;

    const mcs = prFull.merge_commit_sha;
    if (mcs && normalizeSha(mcs) === shaNorm) {
      mergedIntoBase.push(prFull);
      seen.add(prFull.number);
      core.info(`PR #${prFull.number} : merge_commit_sha (API) = commit déployé.`);
      return;
    }

    const nFromMsg = parsePrNumberFromCommitMessage(commitMessage);

    if (nFromMsg === prFull.number) {
      mergedIntoBase.push(prFull);
      seen.add(prFull.number);
      core.info(
        `PR #${prFull.number} : reconnu via le message du commit (squash/merge) — merge_commit_sha API = ${
          mcs ? mcs.slice(0, 7) : 'null'
        }.`
      );
    }
  }

  for (const c of candidates) {
    try {
      const { data: prFull } = await github.rest.pulls.get({
        owner,
        repo,
        pull_number: c.number,
      });
      await tryAcceptPr(prFull);
    } catch (e) {
      core.warning(`pulls.get #${c.number} : ${e.message}`);
    }
  }

  // GitHub lie ce commit à ces PR : si merge vers la base cible, on fait confiance même si merge_commit_sha diverge (bug API).
  if (mergedIntoBase.length === 0 && candidates.length > 0) {
    for (const c of candidates) {
      try {
        const { data: prFull } = await github.rest.pulls.get({
          owner,
          repo,
          pull_number: c.number,
        });
        if (prFull.merged_at && prFull.base?.ref === targetBase && !seen.has(prFull.number)) {
          mergedIntoBase.push(prFull);
          seen.add(prFull.number);
          core.info(
            `PR #${c.number} : associée au commit par l’API (commits/…/pulls) — promotion autorisée malgré éventuelle divergence merge_commit_sha.`
          );
          break;
        }
      } catch (e) {
        core.warning(`Association PR #${c.number} : ${e.message}`);
      }
    }
  }

  // Dernier recours : numéro dans le message seul (API commits/…/pulls vide ou incomplète).
  if (mergedIntoBase.length === 0 && commitMessage) {
    const n = parsePrNumberFromCommitMessage(commitMessage);
    if (n != null) {
      try {
        const { data: prFull } = await github.rest.pulls.get({
          owner,
          repo,
          pull_number: n,
        });
        const mcs = prFull.merge_commit_sha;
        const shaOk = mcs && normalizeSha(mcs) === shaNorm;
        if (
          prFull.merged_at &&
          prFull.base?.ref === targetBase &&
          !seen.has(prFull.number) &&
          (shaOk || !mcs)
        ) {
          mergedIntoBase.push(prFull);
          seen.add(prFull.number);
          core.info(
            `PR #${n} : reconnu via message seul (merge_commit_sha = ${mcs || 'null'}).`
          );
        }
      } catch (e) {
        core.warning(`Fallback message PR #${n} : ${e.message}`);
      }
    }
  }

  // Message de merge/squash personnalisé sans « #numéro » : GitHub enregistre quand même merge_commit_sha sur la PR fermée.
  if (mergedIntoBase.length === 0) {
    try {
      for (let page = 1; page <= 5; page++) {
        const { data: closed } = await github.rest.pulls.list({
          owner,
          repo,
          state: 'closed',
          base: targetBase,
          sort: 'updated',
          direction: 'desc',
          per_page: 100,
          page,
        });
        const hit = closed.find(
          (p) =>
            p.merged_at &&
            p.merge_commit_sha &&
            normalizeSha(p.merge_commit_sha) === shaNorm
        );
        if (hit) {
          const { data: prFull } = await github.rest.pulls.get({
            owner,
            repo,
            pull_number: hit.number,
          });
          mergedIntoBase.push(prFull);
          seen.add(prFull.number);
          core.info(
            `PR #${hit.number} : PR fermée vers « ${targetBase} » avec merge_commit_sha = commit déployé (titre de merge personnalisé OK).`
          );
          break;
        }
        if (closed.length < 100) break;
      }
    } catch (e) {
      core.warning(`Recherche dans les PR fermées (merge_commit_sha) : ${e.message}`);
    }
  }

  if (mergedIntoBase.length === 0) {
    const preview = (commitMessage.split('\n')[0] || '').slice(0, 120);
    core.info(
      `Aucune PR fusionnée vers « ${targetBase} » identifiée pour le commit ${shaFull.slice(0, 7)} ` +
        `— pas d’ouverture automatique de PR de promotion. ` +
        `Sujet du commit (extrait) : ${preview || '(vide)'}`
    );
    return;
  }
  core.info(
    `Commit issu d’une fusion de PR vers ${targetBase} : #${mergedIntoBase.map((p) => p.number).join(', ')}`
  );

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
      '1. Vérifier sur **vdev** si besoin.\n2. **Merge** → lance le CD **vpreprod**.';
    cdLabel = 'CD / vdev';
  } else {
    prBase = 'vprod';
    prHead = 'vpreprod';
    prTitle = '[Promotion] vpreprod → vprod';
    harborName = '1 · Harbor — projet vpreprod';
    mdIntro = '## Promotion vers la production (vprod)';
    mdMergeHint =
      '1. Vérifier sur **vpreprod** si besoin.\n2. **Merge** → lance le CD **production**.';
    cdLabel = 'CD / vpreprod';
  }

  const cdRequired = [
    '0 · CI Monorepo verte sur ce commit (ou manuel)',
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

  const { data: runsPayload } = await github.rest.actions.listWorkflowRunsForRepo({
    owner,
    repo,
    head_sha: shaFull,
    per_page: 50,
  });
  const ciSuccessRuns = (runsPayload.workflow_runs || [])
    .filter(
      (w) =>
        w.name === ciWorkflowName &&
        w.head_branch === headBranch &&
        w.event === 'push' &&
        w.conclusion === 'success'
    )
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  if (ciSuccessRuns.length === 0) {
    core.setFailed(
      `Aucun run « ${ciWorkflowName} » (push/${headBranch}) en succès pour ${shaFull.slice(0, 7)}.`
    );
    return;
  }
  const ciRun = ciSuccessRuns[0];
  core.info(`CI run : #${ciRun.id} (${ciRun.html_url})`);
  const ciJobs = await fetchAllRunJobs(ciRun.id);
  if (!assertJobsOk(ciJobs, 'CI Monorepo')) return;

  const cdJobs = await fetchAllRunJobs(cdRunId);
  for (const name of cdRequired) {
    const j = cdJobs.find((x) => x.name === name);
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
  core.info('CI + CD (jobs 0–3) OK — création PR de promotion.');

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
    'Vérifiez les changements, puis **Merge** quand c’est bon.',
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
      draft: false,
    });
    core.info(`PR créée : #${created.number} ${created.html_url}`);
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
