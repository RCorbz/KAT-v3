import {
    pgTable,
    text,
    timestamp,
    boolean,
    integer,
    json,
    decimal,
    primaryKey,
    unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("user", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    emailVerified: boolean("emailVerified").default(false),
    image: text("image"),
    phone: text("phone"),
    role: text("role").default("user"),
    banned: boolean("banned").default(false),
    banReason: text("banReason"),
    banExpires: timestamp("banExpires", { mode: "date" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const accounts = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    expiresAt: timestamp("expiresAt", { mode: "date" }),
    password: text("password"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const sessions = pgTable("session", {
    id: text("id").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const verifications = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const clinics = pgTable("clinic", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zip: text("zip").notNull(),
    phone: text("phone").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    estimatedWaitMinutes: integer("estimatedWaitMinutes").default(0).notNull(),
    walkInPrice: decimal("walkInPrice", { precision: 10, scale: 2 }).default("125.00").notNull(),
    reservedPrice: decimal("reservedPrice", { precision: 10, scale: 2 }).default("99.00").notNull(),
    googleReviewUrl: text("googleReviewUrl"),
    openDate: timestamp("openDate", { mode: "date" }),

    doctorName: text("doctorName"),
    doctorPicUrl: text("doctorPicUrl"),
    doctorBio: text("doctorBio"),
    doctorPhone: text("doctorPhone"),
    doctorEmail: text("doctorEmail"),
    doctorType: text("doctorType"),
    additionalInfo: json("additionalInfo"),

    // Twilio + SendGrid Integration
    twilioSid: text("twilioSid"),
    twilioToken: text("twilioToken"),
    sendgridApiKey: text("sendgridApiKey"),
});

export const clinicSchedules = pgTable(
    "clinicSchedule",
    {
        id: text("id").primaryKey(),
        clinicId: text("clinicId")
            .notNull()
            .references(() => clinics.id),
        dayOfWeek: integer("dayOfWeek").notNull(),
        openTime: text("openTime").notNull(),
        closeTime: text("closeTime").notNull(),
        isActive: boolean("isActive").default(true).notNull(),
    },
    (table) => ({
        uniqueClinicDay: unique("clinicSchedule_clinicId_dayOfWeek_unique").on(table.clinicId, table.dayOfWeek),
    })
);

export const services = pgTable("service", {
    id: text("id").primaryKey(),
    clinicId: text("clinicId")
        .notNull()
        .references(() => clinics.id),
    name: text("name").notNull(),
    description: text("description"),
    price: decimal("price").notNull(),
    duration: integer("duration").notNull(),
    isUpsell: boolean("isUpsell").default(false).notNull(),
});

export const intakeQuestions = pgTable("intakeQuestion", {
    id: text("id").primaryKey(),
    text: text("text").notNull(),
    jsonKey: text("jsonKey").notNull().unique(),
    type: text("type").notNull(),
    isActive: boolean("isActive").default(true).notNull(),
    order: integer("order").default(0).notNull(),
});

export const appointments = pgTable("appointment", {
    id: text("id").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    clinicId: text("clinicId")
        .notNull()
        .references(() => clinics.id),
    startTime: timestamp("startTime", { mode: "date" }).notNull(),
    endTime: timestamp("endTime", { mode: "date" }).notNull(),
    status: text("status").default("booked").notNull(),
    intakeAnswers: json("intakeAnswers"),
});

// Many-to-Many between appointments and services
export const appointmentServices = pgTable(
    "appointmentService",
    {
        appointmentId: text("appointmentId")
            .notNull()
            .references(() => appointments.id, { onDelete: "cascade" }),
        serviceId: text("serviceId")
            .notNull()
            .references(() => services.id, { onDelete: "cascade" }),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.appointmentId, table.serviceId] }),
    })
);

export const campaignSettings = pgTable(
    "campaignSettings",
    {
        id: text("id").primaryKey(),
        clinicId: text("clinicId")
            .notNull()
            .references(() => clinics.id, { onDelete: "cascade" }),
        phaseName: text("phaseName").notNull(),
        triggerDays: integer("triggerDays").notNull(),
        smsTemplate: text("smsTemplate").default("").notNull(),
        emailTemplate: text("emailTemplate").default("").notNull(),
        sendSms: boolean("sendSms").default(true).notNull(),
        sendEmail: boolean("sendEmail").default(false).notNull(),
        isActive: boolean("isActive").default(true).notNull(),

        lastTestSmsStatus: text("lastTestSmsStatus"),
        lastTestSmsAt: timestamp("lastTestSmsAt", { mode: "date" }),
        lastTestEmailStatus: text("lastTestEmailStatus"),
        lastTestEmailAt: timestamp("lastTestEmailAt", { mode: "date" }),
    },
    (table) => ({
        uniqueClinicPhase: unique("campaignSettings_clinicId_phaseName_unique").on(table.clinicId, table.phaseName),
    })
);

export const retentionLogs = pgTable(
    "retentionLog",
    {
        id: text("id").primaryKey(),
        userId: text("userId")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        campaign: text("campaign").notNull(),
        sentAt: timestamp("sentAt", { mode: "date" }).defaultNow().notNull(),
        status: text("status").notNull(),
    },
    (table) => ({
        uniqueUserCampaign: unique("retentionLog_userId_campaign_unique").on(table.userId, table.campaign),
    })
);

export const reviews = pgTable("review", {
    id: text("id").primaryKey(),
    appointmentId: text("appointmentId").references(() => appointments.id, {
        onDelete: "cascade",
    }),
    userId: text("userId").references(() => users.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    feedbackText: text("feedbackText"),
    aiTheme: text("aiTheme"),
    status: text("status").default("pending").notNull(),
    isFeatured: boolean("isFeatured").default(false).notNull(),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    reviewerName: text("reviewerName"),
});

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
    appointments: many(appointments),
    reviews: many(reviews),
    retentionLogs: many(retentionLogs),
    accounts: many(accounts),
    sessions: many(sessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const clinicsRelations = relations(clinics, ({ many }) => ({
    schedules: many(clinicSchedules),
    services: many(services),
    appointments: many(appointments),
    campaignSettings: many(campaignSettings),
}));

export const clinicSchedulesRelations = relations(
    clinicSchedules,
    ({ one }) => ({
        clinic: one(clinics, {
            fields: [clinicSchedules.clinicId],
            references: [clinics.id],
        }),
    })
);

export const servicesRelations = relations(services, ({ one, many }) => ({
    clinic: one(clinics, {
        fields: [services.clinicId],
        references: [clinics.id],
    }),
    appointments: many(appointmentServices),
}));

export const appointmentsRelations = relations(
    appointments,
    ({ one, many }) => ({
        user: one(users, {
            fields: [appointments.userId],
            references: [users.id],
        }),
        clinic: one(clinics, {
            fields: [appointments.clinicId],
            references: [clinics.id],
        }),
        services: many(appointmentServices),
        reviews: many(reviews),
    })
);

export const appointmentServicesRelations = relations(
    appointmentServices,
    ({ one }) => ({
        appointment: one(appointments, {
            fields: [appointmentServices.appointmentId],
            references: [appointments.id],
        }),
        service: one(services, {
            fields: [appointmentServices.serviceId],
            references: [services.id],
        }),
    })
);

export const campaignSettingsRelations = relations(
    campaignSettings,
    ({ one }) => ({
        clinic: one(clinics, {
            fields: [campaignSettings.clinicId],
            references: [clinics.id],
        }),
    })
);

export const retentionLogsRelations = relations(retentionLogs, ({ one }) => ({
    user: one(users, { fields: [retentionLogs.userId], references: [users.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    appointment: one(appointments, {
        fields: [reviews.appointmentId],
        references: [appointments.id],
    }),
    user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));
