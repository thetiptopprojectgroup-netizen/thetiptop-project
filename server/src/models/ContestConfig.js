import mongoose from 'mongoose';

const contestConfigSchema = new mongoose.Schema(
  {
    contest_start_date: {
      type: Date,
      required: true,
      default: () => new Date('2026-02-23'),
    },
    contest_end_date: {
      type: Date,
      required: true,
      default: () => new Date('2026-03-30'),
    },
    claim_end_date: {
      type: Date,
      required: true,
      default: () => new Date('2026-04-29'),
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'ended', 'claim_period'],
      default: 'not_started',
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to update status based on dates
contestConfigSchema.pre('save', function (next) {
  const now = new Date();
  if (now < this.contest_start_date) {
    this.status = 'not_started';
  } else if (now <= this.contest_end_date) {
    this.status = 'in_progress';
  } else if (now <= this.claim_end_date) {
    this.status = 'claim_period';
  } else {
    this.status = 'ended';
  }
  next();
});

const ContestConfig = mongoose.model('ContestConfig', contestConfigSchema);

export default ContestConfig;
