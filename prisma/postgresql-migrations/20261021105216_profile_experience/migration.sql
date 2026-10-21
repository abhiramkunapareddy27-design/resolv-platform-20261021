-- Add profile experience without rebuilding the table or dropping data.
ALTER TABLE "Profile" ADD COLUMN "experience" TEXT NOT NULL DEFAULT 'Beginner';
