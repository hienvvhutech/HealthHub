BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[HealthData] ADD [patientId] INT;

-- AlterTable
ALTER TABLE [dbo].[Medication] ADD [description] NVARCHAR(1000);

-- AlterTable
ALTER TABLE [dbo].[Medicine] ADD [description] NVARCHAR(1000),
[price] FLOAT(53);

-- AlterTable
ALTER TABLE [dbo].[Notification] ADD [scheduledAt] DATETIME2;

-- AlterTable
ALTER TABLE [dbo].[Prescription] ADD [totalPrice] INT NOT NULL CONSTRAINT [Prescription_totalPrice_df] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[RecommendationLog] ADD [createdAt] DATETIME CONSTRAINT [DF__Recommend__creat__7BE56230] DEFAULT CURRENT_TIMESTAMP,
[riskScore] INT,
[status] NVARCHAR(50) CONSTRAINT [DF__Recommend__statu__7AF13DF7] DEFAULT 'pending',
[suggestedDate] DATETIME,
[suggestedTests] NVARCHAR(max);

-- CreateTable
CREATE TABLE [dbo].[Reexam] (
    [id] INT NOT NULL IDENTITY(1,1),
    [patientId] INT NOT NULL,
    [appointmentId] INT NOT NULL,
    [onTime] BIT NOT NULL CONSTRAINT [Reexam_onTime_df] DEFAULT 0,
    [reexamDate] DATETIME2 NOT NULL,
    [notes] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Reexam_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Reexam_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[CLSType] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(255) NOT NULL,
    CONSTRAINT [PK__CLSType__3213E83FDFAFF2F2] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[PublicChatMessage] (
    [id] INT NOT NULL IDENTITY(1,1),
    [guestId] NVARCHAR(100) NOT NULL,
    [message] NVARCHAR(max) NOT NULL,
    [createdAt] DATETIME CONSTRAINT [DF__PublicCha__creat__0E04126B] DEFAULT CURRENT_TIMESTAMP,
    [sender] NVARCHAR(50) NOT NULL CONSTRAINT [DF__PublicCha__sende__0EF836A4] DEFAULT 'user',
    CONSTRAINT [PK__PublicCh__3213E83F09689875] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[ScreeningPlan] (
    [id] INT NOT NULL IDENTITY(1,1),
    [title] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000) NOT NULL,
    [minAge] INT NOT NULL,
    [maxAge] INT NOT NULL,
    [gender] NVARCHAR(1000) NOT NULL,
    [riskFactor] NVARCHAR(1000),
    [tests] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ScreeningPlan_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [ScreeningPlan_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Device] (
    [id] INT NOT NULL IDENTITY(1,1),
    [userId] INT NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [macAddress] NVARCHAR(1000),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [Device_status_df] DEFAULT 'Active',
    [lastSync] DATETIME2 NOT NULL CONSTRAINT [Device_lastSync_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Device_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sysdiagrams] (
    [name] NVARCHAR(128) NOT NULL,
    [principal_id] INT NOT NULL,
    [diagram_id] INT NOT NULL IDENTITY(1,1),
    [version] INT,
    [definition] VARBINARY(max),
    CONSTRAINT [PK__sysdiagr__C2B05B61FD7621B2] PRIMARY KEY CLUSTERED ([diagram_id]),
    CONSTRAINT [UK_principal_name] UNIQUE NONCLUSTERED ([principal_id],[name])
);

-- AddForeignKey
ALTER TABLE [dbo].[HealthData] ADD CONSTRAINT [HealthData_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Reexam] ADD CONSTRAINT [Reexam_appointmentId_fkey] FOREIGN KEY ([appointmentId]) REFERENCES [dbo].[Appointment]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Reexam] ADD CONSTRAINT [Reexam_patientId_fkey] FOREIGN KEY ([patientId]) REFERENCES [dbo].[Patient]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Device] ADD CONSTRAINT [Device_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
