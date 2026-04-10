import mongoose from "mongoose";

const AttemptSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "question",
    required: true,
  },
  memberId: {
    type: String, // matches Postgres members.member_id
    required: true,
  },
  jumuiyaId: {
    type: String, // matches Postgres sub_groups.group_id (UUID stored as string)
    required: true,
  },
  selectedOption: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  attemptedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast aggregation by jumuiya
AttemptSchema.index({ jumuiyaId: 1, questionId: 1 });

const Attempt = mongoose.model("attempt", AttemptSchema);

export default Attempt;