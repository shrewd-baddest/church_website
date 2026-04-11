CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE  IF NOT EXISTS members (
    member_id VARCHAR(30) PRIMARY KEY NOT NULL,
    jumuiaya_id UUID NOT NULL REFERENCES sub_groups(group_id) ,-- scope isolation
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    gender VARCHAR(10),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    year_of_study VARCHAR(20),
    course VARCHAR(100),
    password VARCHAR NOT NULL,
    join_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE  IF NOT EXISTS roles (
    role_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(50) NOT NULL
);

CREATE TABLE  IF NOT EXISTS member_roles (
    member_id VARCHAR(30) REFERENCES members(member_id),
    role_id uuid REFERENCES roles(role_id),
    PRIMARY KEY(member_id, role_id)
);

//although resource and action are solid we need to add more meta-data to the permission for acountability purposes ,
// we need also to ensure no duplicate entry for the same hence we are going to use a unique constrint for the same
//sometimes we can try to keep the history of permissions without deleting them hece we deplicate the permission , same to we can suspend a permission  and finally the permision can be active
//we need Enums to avoid typos and ensure consistency , where we are going to create Types for actions and resources , later we can add them 

-- Define the resource_type enum
CREATE TYPE resource_type AS ENUM (
  'members',  'roles', 'permissions', 'events', 'contributions', 'notifications', 'uploads', 'audit', 'attendance'
);

-- Define the action_type enum
-- Each value represents an operation that can be performed on a resource
CREATE TYPE action_type AS ENUM (
  'create',  'update', 'delete', 'view', 'assign', 'record',
);


CREATE TABLE  IF NOT EXISTS permissions (
   permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource resource_type NOT NULL, 
    action action_type NOT NULL,     
    description TEXT,           
    created_by VARCHAR(30),  
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','deprecated','disabled')),
    CONSTRAINT unique_resource_action UNIQUE (resource, action)
);



CREATE TABLE  IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(role_id),
    permission_id UUID REFERENCES permissions(permission_id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE audit_logs (
    audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(30),
    jumui_id UUID,
    action VARCHAR(50),
    resource VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details JSONB
);


CREATE TABLE password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(30) REFERENCES members(member_id) ON DELETE CASCADE,
    email VARCHAR(100),
    otp TEXT NOT NULL,
    otp_expires TIMESTAMP NOT NULL,
    temp_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sub_groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jumuiya_name VARCHAR(50) NOT NULL,
    saint_profile_picture INT REFERENCES uploads(id), -- link to uploads table
    description TEXT,
    registered_members INT DEFAULT 0
);


CREATE TABLE event_subgroup_attendance (
    event_id UUID REFERENCES events(event_id) ON DELETE CASCADE,
    group_id UUID REFERENCES sub_groups(group_id) ON DELETE CASCADE,
    attendance_count INT NOT NULL CHECK (attendance_count >= 0),
    PRIMARY KEY (event_id, group_id)
);
CREATE TABLE contributions (
    contribution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(30) REFERENCES members(member_id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(event_id) ON DELETE   SET NULL,
        amount DECIMAL(10, 2) NOT NULL,
        contribution_type VARCHAR(50),
        contribution_date DATE DEFAULT CURRENT_DATE
);
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100),
    message VARCHAR(255),
    posted_at TIMESTAMP DEFAULT NOW(),
    posted_to VARCHAR(100) NOT NULL,
    member_id VARCHAR(30) REFERENCES members(member_id),
    status VARCHAR(100) DEFAULT 'normal' CHECK (status IN ('normal', 'urgent'))
);
CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    public_id TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    format TEXT,
    resource_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE notification_uploads (
    id SERIAL PRIMARY KEY,
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    upload_id INTEGER REFERENCES uploads(id) ON DELETE CASCADE
);
