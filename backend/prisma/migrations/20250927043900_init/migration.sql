BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [email] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Doctor] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [dob] DATETIME2,
    [department] NVARCHAR(1000),
    [userId] INT NOT NULL,
    [hospital] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [experience] INT,
    [languages] NVARCHAR(1000),
    [bio] NVARCHAR(1000),
    [specialtyId] INT,
    CONSTRAINT [Doctor_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Doctor_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [Doctor_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Patient] (
    [id] INT NOT NULL IDENTITY(1,1),
    [code] NVARCHAR(1000),
    [fullName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000),
    [address] NVARCHAR(1000),
    [dob] DATETIME2,
    [userId] INT NOT NULL,
    [avatarUrl] NVARCHAR(1000),
    [bloodType] NVARCHAR(1000),
    [gender] NVARCHAR(1000),
    [height] INT,
    [weight] INT,
    CONSTRAINT [Patient_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Patient_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- CreateTable
CREATE TABLE [dbo].[Appointment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [date] DATETIME2 NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Appointment_status_df] DEFAULT 'Waiting',
    [doctorId] INT NOT NULL,
    [patientId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Appointment_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [note] NVARCHAR(1000),
    [fee] INT NOT NULL CONSTRAINT [Appointment_fee_df] DEFAULT 200000,
    [reExamDate] DATETIME2,
    [specialty] NVARCHAR(1000),
    [time] NVARCHAR(1000),
    [isVisibleForDoctor] BIT NOT NULL CONSTRAINT [Appointment_isVisibleForDoctor_df] DEFAULT 1,
    [sequenceNumber] INT NOT NULL,
    CONSTRAINT [Appointment_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[MedicalRecord] (
    [id] INT NOT NULL IDENTITY(1,1),
    [patientId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [date] DATETIME2 NOT NULL,
    [appointmentId] INT NOT NULL,
    [doctorId] INT NOT NULL,
    [note] NVARCHAR(1000),
    [reExamDate] DATETIME2,
    [confirmedReExam] BIT NOT NULL CONSTRAINT [MedicalRecord_confirmedReExam_df] DEFAULT 0,
    [prescriptionId] INT,
    [diseaseId] INT,
    CONSTRAINT [MedicalRecord_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [MedicalRecord_appointmentId_key] UNIQUE NONCLUSTERED ([appointmentId]),
    CONSTRAINT [MedicalRecord_prescriptionId_key] UNIQUE NONCLUSTERED ([prescriptionId])
);

-- CreateTable
CREATE TABLE [dbo].[CanLamSang] (
    [id] INT NOT NULL IDENTITY(1,1),
    [appointmentId] INT NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [result] NVARCHAR(1000) NOT NULL,
    [note] NVARCHAR(1000),
    [date] DATETIME2 NOT NULL CONSTRAINT [CanLamSang_date_df] DEFAULT CURRENT_TIMESTAMP,
    [cost] INT NOT NULL CONSTRAINT [CanLamSang_cost_df] DEFAULT 0,
    CONSTRAINT [CanLamSang_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Feedback] (
    [id] INT NOT NULL IDENTITY(1,1),
    [fullName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Feedback_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [doctorId] INT NOT NULL,
    [appointmentId] INT NOT NULL,
    CONSTRAINT [Feedback_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Prescription] (
    [id] INT NOT NULL IDENTITY(1,1),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Prescription_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [appointmentId] INT NOT NULL,
    [instructions] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Prescription_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Prescription_appointmentId_key] UNIQUE NONCLUSTERED ([appointmentId])
);

-- CreateTable
CREATE TABLE [dbo].[Medication] (
    [id] INT NOT NULL IDENTITY(1,1),
    [prescriptionId] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [dosage] NVARCHAR(1000) NOT NULL,
    [frequency] NVARCHAR(1000) NOT NULL,
    [duration] NVARCHAR(1000) NOT NULL,
    [note] NVARCHAR(1000),
    [prescriptionAppointmentId] INT NOT NULL CONSTRAINT [Medication_prescriptionAppointmentId_df] DEFAULT 0,
    [price] INT NOT NULL CONSTRAINT [Medication_price_df] DEFAULT 0,
    CONSTRAINT [Medication_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Specialty] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    CONSTRAINT [Specialty_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Specialty_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[ResetToken] (
    [id] INT NOT NULL IDENTITY(1,1),
    [token] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ResetToken_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [ResetToken_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ResetToken_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[ChatSession] (
    [id] INT NOT NULL IDENTITY(1,1),
    [doctorId] INT NOT NULL,
    [patientId] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ChatSession_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ChatSession_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ChatMessage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [content] NVARCHAR(1000) NOT NULL,
    [chatSessionId] INT NOT NULL,
    [senderId] INT NOT NULL,
    [receiverId] INT NOT NULL,
    [sentAt] DATETIME2 NOT NULL CONSTRAINT [ChatMessage_sentAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ChatMessage_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Medicine] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [dosage] NVARCHAR(1000),
    [unit] NVARCHAR(1000),
    [note] NVARCHAR(1000),
    CONSTRAINT [Medicine_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Disease] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [icd_code] NVARCHAR(1000),
    [description] NVARCHAR(1000),
    CONSTRAINT [Disease_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PrescriptionItem] (
    [id] INT NOT NULL IDENTITY(1,1),
    [appointmentId] INT NOT NULL,
    [medicineId] INT NOT NULL,
    [quantity] INT NOT NULL,
    [usage] NVARCHAR(1000),
    CONSTRAINT [PrescriptionItem_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Notification] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [message] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Notification_status_df] DEFAULT 'Unread',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Notification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Notification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Payment] (
    [id] INT NOT NULL IDENTITY(1,1),
    [appointmentId] INT NOT NULL,
    [amount] INT NOT NULL,
    [method] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [transactionDate] DATETIME2 NOT NULL CONSTRAINT [Payment_transactionDate_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Payment_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Payment_appointmentId_key] UNIQUE NONCLUSTERED ([appointmentId])
);

-- CreateTable
CREATE TABLE [dbo].[HealthData] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [metric] NVARCHAR(1000) NOT NULL,
    [value] NVARCHAR(1000) NOT NULL,
    [collectedAt] DATETIME2 NOT NULL CONSTRAINT [HealthData_collectedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [source] NVARCHAR(1000),
    CONSTRAINT [HealthData_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[RecommendationLog] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [suggestedAt] DATETIME2 NOT NULL CONSTRAINT [RecommendationLog_suggestedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [RecommendationLog_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Doctor] ADD CONSTRAINT [Doctor_specialtyId_fkey] FOREIGN KEY ([specialtyId]) REFERENCES [dbo].[Specialty]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Doctor] ADD CONSTRAINT [Doctor_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Patient] ADD CONSTRAINT [Patient_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Appointment] ADD CONSTRAINT [Appointment_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MedicalRecord] ADD CONSTRAINT [MedicalRecord_diseaseId_fkey] FOREIGN KEY ([diseaseId]) REFERENCES [dbo].[Disease]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[MedicalRecord] ADD CONSTRAINT [FK_MedicalRecord_Appointment] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MedicalRecord] ADD CONSTRAINT [MedicalRecord_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MedicalRecord] ADD CONSTRAINT [MedicalRecord_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[MedicalRecord] ADD CONSTRAINT [MedicalRecord_prescriptionId_fkey] FOREIGN KEY ([prescriptionId]) REFERENCES [dbo].[Prescription]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[CanLamSang] ADD CONSTRAINT [CanLamSang_appointmentId_fkey] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Feedback] ADD CONSTRAINT [Feedback_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Feedback] ADD CONSTRAINT [Feedback_appointmentId_fkey] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Prescription] ADD CONSTRAINT [Prescription_appointmentId_fkey] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Medication] ADD CONSTRAINT [Medication_prescriptionId_fkey] FOREIGN KEY ([prescriptionId]) REFERENCES [dbo].[Prescription]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatSession] ADD CONSTRAINT [ChatSession_doctorId_fkey] FOREIGN KEY ([doctorId]) REFERENCES [dbo].[Doctor]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatSession] ADD CONSTRAINT [ChatSession_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatMessage] ADD CONSTRAINT [ChatMessage_chatSessionId_fkey] FOREIGN KEY ([chatSessionId]) REFERENCES [dbo].[ChatSession]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PrescriptionItem] ADD CONSTRAINT [PrescriptionItem_appointmentId_fkey] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[PrescriptionItem] ADD CONSTRAINT [PrescriptionItem_medicineId_fkey] FOREIGN KEY ([medicineId]) REFERENCES [dbo].[Medicine]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [Notification_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Payment] ADD CONSTRAINT [Payment_appointmentId_fkey] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[HealthData] ADD CONSTRAINT [HealthData_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[RecommendationLog] ADD CONSTRAINT [RecommendationLog_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
