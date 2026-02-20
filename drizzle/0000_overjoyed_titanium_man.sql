CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"expiresAt" timestamp,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointmentService" (
	"appointmentId" text NOT NULL,
	"serviceId" text NOT NULL,
	CONSTRAINT "appointmentService_appointmentId_serviceId_pk" PRIMARY KEY("appointmentId","serviceId")
);
--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"clinicId" text NOT NULL,
	"startTime" timestamp NOT NULL,
	"endTime" timestamp NOT NULL,
	"status" text DEFAULT 'booked' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaignSettings" (
	"id" text PRIMARY KEY NOT NULL,
	"clinicId" text NOT NULL,
	"phaseName" text NOT NULL,
	"triggerDays" integer NOT NULL,
	"smsTemplate" text DEFAULT '' NOT NULL,
	"emailTemplate" text DEFAULT '' NOT NULL,
	"sendSms" boolean DEFAULT true NOT NULL,
	"sendEmail" boolean DEFAULT false NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"lastTestSmsStatus" text,
	"lastTestSmsAt" timestamp,
	"lastTestEmailStatus" text,
	"lastTestEmailAt" timestamp,
	CONSTRAINT "campaignSettings_clinicId_phaseName_pk" PRIMARY KEY("clinicId","phaseName")
);
--> statement-breakpoint
CREATE TABLE "clinicSchedule" (
	"id" text PRIMARY KEY NOT NULL,
	"clinicId" text NOT NULL,
	"dayOfWeek" integer NOT NULL,
	"openTime" text NOT NULL,
	"closeTime" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "clinicSchedule_clinicId_dayOfWeek_pk" PRIMARY KEY("clinicId","dayOfWeek")
);
--> statement-breakpoint
CREATE TABLE "clinic" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"zip" text NOT NULL,
	"phone" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"googleReviewUrl" text,
	"openDate" timestamp,
	"doctorName" text,
	"doctorPicUrl" text,
	"doctorBio" text,
	"doctorPhone" text,
	"doctorEmail" text,
	"doctorType" text,
	"additionalInfo" json,
	"twilioSid" text,
	"twilioToken" text,
	"sendgridApiKey" text,
	CONSTRAINT "clinic_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "intakeQuestion" (
	"id" text PRIMARY KEY NOT NULL,
	"text" text NOT NULL,
	"jsonKey" text NOT NULL,
	"type" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "intakeQuestion_jsonKey_unique" UNIQUE("jsonKey")
);
--> statement-breakpoint
CREATE TABLE "retentionLog" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"campaign" text NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	CONSTRAINT "retentionLog_userId_campaign_pk" PRIMARY KEY("userId","campaign")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"appointmentId" text,
	"userId" text,
	"rating" integer NOT NULL,
	"feedbackText" text,
	"aiTheme" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"isFeatured" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"reviewerName" text
);
--> statement-breakpoint
CREATE TABLE "service" (
	"id" text PRIMARY KEY NOT NULL,
	"clinicId" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric NOT NULL,
	"duration" integer NOT NULL,
	"isUpsell" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"emailVerified" boolean DEFAULT false,
	"image" text,
	"phone" text,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"banReason" text,
	"banExpires" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointmentService" ADD CONSTRAINT "appointmentService_appointmentId_appointment_id_fk" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointmentService" ADD CONSTRAINT "appointmentService_serviceId_service_id_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_clinicId_clinic_id_fk" FOREIGN KEY ("clinicId") REFERENCES "public"."clinic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaignSettings" ADD CONSTRAINT "campaignSettings_clinicId_clinic_id_fk" FOREIGN KEY ("clinicId") REFERENCES "public"."clinic"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinicSchedule" ADD CONSTRAINT "clinicSchedule_clinicId_clinic_id_fk" FOREIGN KEY ("clinicId") REFERENCES "public"."clinic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retentionLog" ADD CONSTRAINT "retentionLog_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_appointmentId_appointment_id_fk" FOREIGN KEY ("appointmentId") REFERENCES "public"."appointment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service" ADD CONSTRAINT "service_clinicId_clinic_id_fk" FOREIGN KEY ("clinicId") REFERENCES "public"."clinic"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;