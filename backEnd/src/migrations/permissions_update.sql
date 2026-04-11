-- BEGIN;
-- -- -- enums
-- -- CREATE TYPE resource_type AS ENUM (
-- --   'members','roles','permissions','events',
-- --   'contributions','notifications','uploads','audit','attendance'
-- -- );
-- -- CREATE TYPE action_type AS ENUM (
-- --   'create','update','delete','view','assign','record','link'
-- -- );

-- -- -- alter table
-- -- ALTER TABLE permissions
-- -- ALTER COLUMN resource TYPE resource_type USING resource::resource_type,
-- -- ALTER COLUMN action TYPE action_type USING action::action_type;

-- -- ALTER TABLE permissions
-- -- ADD COLUMN description TEXT,
-- -- ADD COLUMN created_by VARCHAR(30),
-- -- ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
-- -- ADD COLUMN status VARCHAR(20) DEFAULT 'active'
-- --     CHECK (status IN ('active','deprecated','disabled'));

-- -- ALTER TABLE permissions
-- -- ADD CONSTRAINT unique_resource_action UNIQUE (resource, action);



-- -- CREATE TABLE IF NOT EXISTS roles (
-- --     role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
-- --     role_name VARCHAR(50) NOT NULL,
-- --     description TEXT,                          -- human-readable explanation
-- --     created_by VARCHAR(30),                    -- who created the role
-- --     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
-- --     status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','deprecated','disabled')),
-- --     CONSTRAINT unique_role_name UNIQUE (role_name)
-- -- );


-- -- INSERT INTO roles (role_id, role_name, description, created_by)
-- -- VALUES
-- -- (gen_random_uuid(), 'Chairperson', 'Overall leader with full permissions across members, roles, events, notifications, uploads, and audit logs.', 'Robert'),
-- -- (gen_random_uuid(), 'Assistant_Chairperson', 'Supports chairperson with limited permissions; can view and update members, manage events, record attendance, and send notifications.', 'Robert'),
-- -- (gen_random_uuid(), 'Organizing_Secretary', 'Responsible for organizing events and attendance; manages notifications related to church activities.', 'Robert'),
-- -- (gen_random_uuid(), 'Treasurer', 'Manages financial contributions with full control; can view events and access audit logs for accountability.', 'Robert'),
-- -- (gen_random_uuid(), 'Secretary', 'Handles member registration and updates; manages events, notifications, and uploads for communication.', 'Robert'),
-- -- (gen_random_uuid(), 'Assistant_Secretary', 'Supports secretary with read-only access to members, events, notifications, and uploads.', 'Robert'),
-- -- (gen_random_uuid(), 'Liturgist', 'Focuses on liturgical resources; can view events, notifications, and uploaded liturgy materials.', 'Robert'),
-- -- (gen_random_uuid(), 'Assistant_Liturgist', 'Supports liturgist with limited access; can view events and notifications only.', 'Robert'),
-- -- (gen_random_uuid(), 'Member', 'Regular participant with view-only access to events and notifications.', 'Robert');


-- -- INSERT INTO permissions (permission_id, resource, action, description, created_by)
-- -- VALUES
-- -- -- Members
-- -- (gen_random_uuid(), 'members', 'create', 'Allows adding new members to the system.', 'Robert'),
-- -- (gen_random_uuid(), 'members', 'update', 'Allows editing existing member details.', 'Robert'),
-- -- (gen_random_uuid(), 'members', 'delete', 'Allows removing members from the system.', 'Robert'),
-- -- (gen_random_uuid(), 'members', 'view', 'Allows viewing member information.', 'Robert'),

-- -- -- Roles
-- -- (gen_random_uuid(), 'roles', 'create', 'Allows creating new roles.', 'Robert'),
-- -- (gen_random_uuid(), 'roles', 'assign', 'Allows assigning roles to members.', 'Robert'),
-- -- (gen_random_uuid(), 'roles', 'view', 'Allows viewing existing roles.', 'Robert'),

-- -- -- Permissions
-- -- (gen_random_uuid(), 'permissions', 'create', 'Allows defining new permissions.', 'Robert'),
-- -- (gen_random_uuid(), 'permissions', 'assign', 'Allows assigning permissions to roles.', 'Robert'),

-- -- -- Events
-- -- (gen_random_uuid(), 'events', 'create', 'Allows scheduling new events.', 'Robert'),
-- -- (gen_random_uuid(), 'events', 'update', 'Allows editing event details.', 'Robert'),
-- -- (gen_random_uuid(), 'events', 'delete', 'Allows canceling events.', 'Robert'),
-- -- (gen_random_uuid(), 'events', 'view', 'Allows viewing event details.', 'Robert'),

-- -- -- Attendance
-- -- (gen_random_uuid(), 'attendance', 'record', 'Allows recording attendance for events.', 'Robert'),

-- -- -- Contributions
-- -- (gen_random_uuid(), 'contributions', 'create', 'Allows recording contributions.', 'Robert'),
-- -- (gen_random_uuid(), 'contributions', 'update', 'Allows editing contribution records.', 'Robert'),
-- -- (gen_random_uuid(), 'contributions', 'delete', 'Allows removing contribution records.', 'Robert'),
-- -- (gen_random_uuid(), 'contributions', 'view', 'Allows viewing contributions.', 'Robert'),

-- -- -- Notifications
-- -- (gen_random_uuid(), 'notifications', 'create', 'Allows sending notifications.', 'Robert'),
-- -- (gen_random_uuid(), 'notifications', 'update', 'Allows editing notifications.', 'Robert'),
-- -- (gen_random_uuid(), 'notifications', 'delete', 'Allows removing notifications.', 'Robert'),
-- -- (gen_random_uuid(), 'notifications', 'view', 'Allows viewing notifications.', 'Robert'),

-- -- -- Uploads
-- -- (gen_random_uuid(), 'uploads', 'create', 'Allows uploading files or media.', 'Robert'),
-- -- (gen_random_uuid(), 'uploads', 'delete', 'Allows deleting uploaded files.', 'Robert'),
-- -- (gen_random_uuid(), 'uploads', 'view', 'Allows viewing uploaded files.', 'Robert'),

-- -- -- Audit
-- -- (gen_random_uuid(), 'audit', 'view', 'Allows viewing audit logs.', 'Robert');



-- -- Chairperson: full permissions across members, roles, permissions, events, attendance, contributions, notifications, uploads, audit
-- INSERT INTO role_permissions (role_id, permission_id)
-- VALUES
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','848ebf69-fb8a-4198-87cd-c3aa7238dce9'), -- members:create
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','b73499d3-2437-4145-a671-d327a0a2e324'), -- members:update
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','75193e9d-e075-4027-9ecd-4efaedbd6e80'), -- members:delete
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','c081c01d-7245-472f-ad95-4224844d31a0'), -- members:view
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','95f86aae-4f2e-4db4-b55d-e53c1d70cea7'), -- roles:create
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','f3f6e556-5bb3-4982-9714-fef68854c98b'), -- roles:view
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','7c4342c6-fcdb-46e0-8436-54166f9674ab'), -- roles:assign
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','5d4d3329-d481-4324-801e-5e99ab80f063'), -- permissions:create
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','79a9d6bd-cea9-45a5-9190-0bf27f5caae9'), -- permissions:assign
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','0897136e-35f3-4a2c-8625-c84681504dd9'), -- events:create
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','63c6c811-7732-4b99-bb5d-28b026c88a08'), -- events:update
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','65173968-4b42-46e2-a570-09bd247dab4f'), -- events:delete
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','16715a09-0890-40c5-88ae-8e7174ee4e15'), -- attendance:record
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','5f1ea975-a0f7-4206-9534-a684727b490e'), -- contributions:view
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','6334073a-00b6-474d-ab1b-5c869fa01138'), -- notifications:create
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','99547fa2-9370-4ddc-8132-2ef0e0d52cc6'), -- notifications:update
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','2560b6bb-8b95-495c-94bc-217e003a3836'), -- notifications:delete
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','8753d8c7-2331-4a8d-8235-9ee122d013d8'), -- notifications:view
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','eff2a6ce-95d1-4289-b4a8-37589d06cf9d'), -- uploads:create
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','35821199-4977-4440-a5cd-ede1ac991e8f'), -- uploads:view
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','d5e53f84-d6b5-47b9-ba4a-de5b9d0a1d4c'), -- uploads:delete
-- ('d8aba447-8b24-4aa7-b99a-8c717e6557e3','e4ca0082-812a-4cab-bd2b-c5d04d992647'); -- audit:view

-- -- Assistant Chairperson: limited permissions
-- INSERT INTO role_permissions (role_id, permission_id)
-- VALUES
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','c081c01d-7245-472f-ad95-4224844d31a0'), -- members:view
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','b73499d3-2437-4145-a671-d327a0a2e324'), -- members:update
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','f3f6e556-5bb3-4982-9714-fef68854c98b'), -- roles:view
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','0897136e-35f3-4a2c-8625-c84681504dd9'), -- events:create
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','63c6c811-7732-4b99-bb5d-28b026c88a08'), -- events:update
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','16715a09-0890-40c5-88ae-8e7174ee4e15'), -- attendance:record
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','5f1ea975-a0f7-4206-9534-a684727b490e'), -- contributions:view
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','6334073a-00b6-474d-ab1b-5c869fa01138'), -- notifications:create
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','8753d8c7-2331-4a8d-8235-9ee122d013d8'), -- notifications:view
-- ('7c4916e7-b83d-4065-b1e3-e9d15e56b4a0','35821199-4977-4440-a5cd-ede1ac991e8f'); -- uploads:view

-- -- (Secretary, Assistant Secretary, Organizing Secretary, Treasurer, Liturgist, Assistant Liturgist, Member follow the same pattern...)

-- -- Secretary
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','848ebf69-fb8a-4198-87cd-c3aa7238dce9'), -- members:create
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','b73499d3-2437-4145-a671-d327a0a2e324'), -- members:update
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','c081c01d-7245-472f-ad95-4224844d31a0'), -- members:view
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','0897136e-35f3-4a2c-8625-c84681504dd9'), -- events:create
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','63c6c811-7732-4b99-bb5d-28b026c88a08'), -- events:update
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','6334073a-00b6-474d-ab1b-5c869fa01138'), -- notifications:create
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','99547fa2-9370-4ddc-8132-2ef0e0d52cc6'), -- notifications:update
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','8753d8c7-2331-4a8d-8235-9ee122d013d8'), -- notifications:view
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','eff2a6ce-95d1-4289-b4a8-37589d06cf9d'), -- uploads:create
-- ('ee7e2702-aecb-4a77-acaf-f0fd64b5fda1','35821199-4977-4440-a5cd-ede1ac991e8f'); -- uploads:view

-- -- Assistant Secretary
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('b47a16a5-897c-4699-8a93-5a1c256a7430','c081c01d-7245-472f-ad95-4224844d31a0'), -- members:view
-- ('b47a16a5-897c-4699-8a93-5a1c256a7430','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('b47a16a5-897c-4699-8a93-5a1c256a7430','8753d8c7-2331-4a8d-8235-9ee122d013d8'), -- notifications:view
-- ('b47a16a5-897c-4699-8a93-5a1c256a7430','35821199-4977-4440-a5cd-ede1ac991e8f'); -- uploads:view

-- -- Organizing Secretary
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('d73bd3ba-faeb-4a37-a23c-7bee6ba76fec','0897136e-35f3-4a2c-8625-c84681504dd9'), -- events:create
-- ('d73bd3ba-faeb-4a37-a23c-7bee6ba76fec','63c6c811-7732-4b99-bb5d-28b026c88a08'), -- events:update
-- ('d73bd3ba-faeb-4a37-a23c-7bee6ba76fec','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('d73bd3ba-faeb-4a37-a23c-7bee6ba76fec','16715a09-0890-40c5-88ae-8e7174ee4e15'), -- attendance:record
-- ('d73bd3ba-faeb-4a37-a23c-7bee6ba76fec','6334073a-00b6-474d-ab1b-5c869fa01138'), -- notifications:create
-- ('d73bd3ba-faeb-4a37-a23c-7bee6ba76fec','8753d8c7-2331-4a8d-8235-9ee122d013d8'); -- notifications:view

-- -- Treasurer
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('e694f198-058a-4d51-a4d0-566aa22df870','5d414e8a-2e51-4ecb-b2a0-bf376172137a'), -- contributions:create
-- ('e694f198-058a-4d51-a4d0-566aa22df870','f74e0166-3dba-4382-ae6b-95b767344c7f'), -- contributions:update
-- ('e694f198-058a-4d51-a4d0-566aa22df870','5f1ea975-a0f7-4206-9534-a684727b490e'), -- contributions:view
-- ('e694f198-058a-4d51-a4d0-566aa22df870','aceeca3d-7f2b-4694-b8aa-a4796e3e84ec'), -- contributions:delete
-- ('e694f198-058a-4d51-a4d0-566aa22df870','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('e694f198-058a-4d51-a4d0-566aa22df870','e4ca0082-812a-4cab-bd2b-c5d04d992647'); -- audit:view

-- -- Liturgist
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('1c809127-3188-4ef2-b1e4-8c035d5459d7','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('1c809127-3188-4ef2-b1e4-8c035d5459d7','8753d8c7-2331-4a8d-8235-9ee122d013d8'), -- notifications:view
-- ('1c809127-3188-4ef2-b1e4-8c035d5459d7','35821199-4977-4440-a5cd-ede1ac991e8f'); -- uploads:view

-- -- Assistant Liturgist
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('afdcf2ca-2193-4198-a653-7b5874426154','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('afdcf2ca-2193-4198-a653-7b5874426154','8753d8c7-2331-4a8d-8235-9ee122d013d8'); -- notifications:view

-- -- Member
-- INSERT INTO role_permissions (role_id, permission_id) VALUES
-- ('2d302b6f-aa0e-4740-a73d-41f8640a18dd','e97d428c-fce1-4a59-a7f8-9b801e1a2bd3'), -- events:view
-- ('2d302b6f-aa0e-4740-a73d-41f8640a18dd','8753d8c7-2331-4a8d-8235-9ee122d013d8'); -- notifications:view




-- -- Add the new column jumuia_id if it doesn't exist
-- ALTER TABLE members
-- ADD COLUMN jumuia_id UUID;

-- -- Add the foreign key constraint to reference sub_groups(group_id)
-- ALTER TABLE members
-- ADD CONSTRAINT fk_members_jumuia
-- FOREIGN KEY (jumuia_id) REFERENCES sub_groups(group_id);

-- Add saint profile picture column (foreign key to uploads table)
-- ALTER TABLE sub_groups
-- ADD COLUMN saint_profile_picture INT;

-- ALTER TABLE sub_groups
-- ADD CONSTRAINT fk_subgroups_uploads
-- FOREIGN KEY (saint_profile_picture) REFERENCES uploads(id);



-- -- Add registered_members column
-- ALTER TABLE sub_groups
-- ADD COLUMN jumuiya_name VARCHAR(50) NOT NULL;


-- INSERT INTO sub_groups (jumuiya_name)
-- VALUES
--     ('St Antony'),
--     ('St Augustine'),
--     ('St Cathline'),
--     ('St Dominic'),
--     ('St Elizabeth'),
--     ('St Mariaghoriti'),
--     ('St Monica');

-- -- 1. Add the column as nullable first
-- ALTER TABLE sub_groups
-- ADD COLUMN jumuiya_name VARCHAR(50);

-- -- 2. Backfill existing rows with placeholder or actual names
-- UPDATE sub_groups
-- SET jumuiya_name = 'Unknown'
-- WHERE jumuiya_name IS NULL;

-- -- Or, if you know the actual names for each group_id, update them directly:
-- -- UPDATE sub_groups SET jumuiya_name = 'St Antony' WHERE group_id = 'uuid-here';

-- -- 3. Enforce NOT NULL once all rows have values
-- ALTER TABLE sub_groups
-- ALTER COLUMN jumuiya_name SET NOT NULL;

-- 4. Optionally enforce uniqueness
-- ALTER TABLE sub_groups
-- ADD CONSTRAINT uq_jumuiya_name UNIQUE (jumuiya_name);



-- Ensure the "Member" role exists
-- INSERT INTO roles (role_name) VALUES ('Member')
-- ON CONFLICT (role_name) DO NOTHING;

-- -- Trigger function to assign default role
-- CREATE OR REPLACE FUNCTION assign_default_role()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     default_role UUID;
-- BEGIN
--     -- Get the role_id for 'Member'
--     SELECT role_id INTO default_role FROM roles WHERE role_name = 'Member';

--     -- Insert into member_roles
--     INSERT INTO member_roles (member_id, role_id)
--     VALUES (NEW.member_id, default_role);

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- -- Attach trigger to members table
-- CREATE TRIGGER trg_assign_default_role
-- AFTER INSERT ON members
-- FOR EACH ROW
-- EXECUTE FUNCTION assign_default_role();


-- ALTER TABLE members
-- drop column jumuia_id;





-- -- Strengthen constraints on existing columns
-- ALTER TABLE members
-- ALTER COLUMN member_id SET NOT NULL,
-- ALTER COLUMN first_name SET NOT NULL,
-- ALTER COLUMN last_name SET NOT NULL,
-- ALTER COLUMN email SET NOT NULL,
-- ALTER COLUMN password SET NOT NULL,
-- ALTER COLUMN jumuiya_id SET NOT NULL,
-- ALTER COLUMN join_date SET NOT NULL;

-- -- Optional: enforce gender values
-- ALTER TABLE members
-- ADD CONSTRAINT gender_check CHECK (gender IN ('male','female'));

-- -- Optional: enforce year_of_study to be numeric string
-- ALTER TABLE members
-- ADD CONSTRAINT year_of_study_check CHECK (year_of_study ~ '^[0-9]+$');

-- -- Add semester registration flags (all default false, not null)



-- COMMIT;
