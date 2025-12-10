-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE public.users (
	id serial4 NOT NULL,
	"name" varchar(100) NOT NULL,
	email varchar(100) NOT NULL,
	"phoneCode" varchar(3) NOT NULL,
	phone varchar(15) NOT NULL,
	"password" varchar(255) NOT NULL,
	"roleId" int4 NOT NULL,
	"procurementManagerId" int4 NULL,
	"isVerified" bool DEFAULT false NULL,
	"isActive" bool DEFAULT false NULL,
	"isDeleted" bool DEFAULT false NULL,
	"createdBy" int4 NULL,
	"updatedBy" int4 NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT users_email_key UNIQUE (email),
	CONSTRAINT users_phone_key UNIQUE (phone),
	CONSTRAINT users_pkey PRIMARY KEY (id)
);


-- public.checklist definition

-- Drop table

-- DROP TABLE public.checklist;

CREATE TABLE public.checklist (
	id serial4 NOT NULL,
	"clientId" int4 NOT NULL,
	title varchar(255) NOT NULL,
	"version" int4 DEFAULT 1 NULL,
	questions jsonb NOT NULL,
	"isDeleted" bool DEFAULT false NULL,
	"createdBy" int4 NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT checklist_pkey PRIMARY KEY (id),
	CONSTRAINT "checklist_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES public.users(id),
	CONSTRAINT "checklist_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id)
);


-- public.checklist_versions definition

-- Drop table

-- DROP TABLE public.checklist_versions;

CREATE TABLE public.checklist_versions (
	id serial4 NOT NULL,
	"checklistId" int4 NOT NULL,
	"version" int4 DEFAULT 1 NULL,
	questions jsonb NOT NULL,
	"createdBy" int4 NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT checklist_versions_pkey PRIMARY KEY (id),
	CONSTRAINT "checklist_versions_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES public.checklist(id),
	CONSTRAINT "checklist_versions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id)
);


-- public.orders definition

-- Drop table

-- DROP TABLE public.orders;

CREATE TABLE public.orders (
	id serial4 NOT NULL,
	"clientId" int4 NULL,
	"checklistId" int4 NULL,
	"checklistVersion" int4 DEFAULT 1 NULL,
	"procurmentManagerId" int4 NULL,
	"inspectionManagerId" int4 NULL,
	status public."enum_orders_status" DEFAULT 'pending'::enum_orders_status NULL,
	"createdBy" int4 NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT orders_pkey PRIMARY KEY (id),
	CONSTRAINT "orders_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES public.checklist(id),
	CONSTRAINT "orders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id),
	CONSTRAINT "orders_inspectionManagerId_fkey" FOREIGN KEY ("inspectionManagerId") REFERENCES public.users(id),
	CONSTRAINT "orders_procurmentManagerId_fkey" FOREIGN KEY ("procurmentManagerId") REFERENCES public.users(id)
);


-- public.order_activities definition

-- Drop table

-- DROP TABLE public.order_activities;

CREATE TABLE public.order_activities (
	id serial4 NOT NULL,
	"orderId" int4 NOT NULL,
	"userId" int4 NOT NULL,
	"activityType" varchar(255) NOT NULL,
	details jsonb NULL,
	"createdAt" timestamptz NOT NULL,
	CONSTRAINT order_activities_pkey PRIMARY KEY (id),
	CONSTRAINT "order_activities_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id),
	CONSTRAINT "order_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id)
);


-- public.order_checklist_answers definition

-- Drop table

-- DROP TABLE public.order_checklist_answers;

CREATE TABLE public.order_checklist_answers (
	id serial4 NOT NULL,
	"orderId" int4 NULL,
	"checklistId" int4 NULL,
	"checklistVersion" int4 NOT NULL,
	answers jsonb NOT NULL,
	"createdBy" int4 NOT NULL,
	"createdAt" timestamptz NOT NULL,
	"updatedAt" timestamptz NOT NULL,
	CONSTRAINT "order_checklist_answers_orderId_key" UNIQUE ("orderId"),
	CONSTRAINT order_checklist_answers_pkey PRIMARY KEY (id),
	CONSTRAINT "order_checklist_answers_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES public.checklist(id),
	CONSTRAINT "order_checklist_answers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES public.users(id),
	CONSTRAINT "order_checklist_answers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public.orders(id)
);