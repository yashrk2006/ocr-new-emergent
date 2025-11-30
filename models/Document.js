import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalFilePath: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'eng',
    },
    ocrText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    characterCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
DocumentSchema.index({ userId: 1, createdAt: -1 });
DocumentSchema.index({ status: 1 });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
