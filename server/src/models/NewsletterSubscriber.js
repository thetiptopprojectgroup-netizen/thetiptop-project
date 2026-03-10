import mongoose from 'mongoose';

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email invalide'],
    },
    consent: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      default: 'footer',
      enum: ['footer', 'home', 'modal'],
    },
  },
  { timestamps: true }
);

newsletterSubscriberSchema.index({ email: 1 });
newsletterSubscriberSchema.index({ createdAt: -1 });

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
