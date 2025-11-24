import { supabase } from "../config/supabaseClient.js";
import { AppError } from "../utils/AppError.js";
import { config } from "../config/env.js";

async function getRoleForAdmin(roleId, adminId) {
  if (!roleId) {
    throw new AppError("Role is required", 400);
  }

  const { data, error } = await supabase
    .from("admin_roles")
    .select("*")
    .eq("id", roleId)
    .eq("created_by", adminId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new AppError("Role not found for this workspace", 404);
    }
    throw new AppError(error.message, 500);
  }

  return data;
}

const sanitizeUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  created_at: user.created_at,
  confirmed_at: user.confirmed_at,
  last_sign_in_at: user.last_sign_in_at,
  app_metadata: user.app_metadata,
  user_metadata: user.user_metadata,
});

export async function createTeamMemberAccount({
  email,
  password,
  fullName,
  roleId,
  adminId,
}) {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const role = await getRoleForAdmin(roleId, adminId);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName || "",
      owner_id: adminId,
      role_ids: [role.id],
      role_names: [role.name],
    },
    app_metadata: {
      owner_id: adminId,
      roles: [role.name],
    },
  });

  if (error) {
    throw new AppError(error.message, error.status ?? 400);
  }

  return sanitizeUserResponse(data.user);
}

export async function inviteTeamMember({
  email,
  fullName,
  roleId,
  adminId,
}) {
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const role = await getRoleForAdmin(roleId, adminId);

  const userMetadata = {
    full_name: fullName || "",
    owner_id: adminId,
    role_ids: [role.id],
    role_names: [role.name],
  };

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    redirectTo: config.appUrl,
    data: userMetadata,
  });

  if (error) {
    throw new AppError(error.message, error.status ?? 400);
  }

  if (data?.user) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      data.user.id,
      {
        app_metadata: {
          owner_id: adminId,
          roles: [role.name],
        },
        user_metadata: userMetadata,
      }
    );
    if (updateError) {
      throw new AppError(updateError.message, updateError.status ?? 400);
    }
  }

  return sanitizeUserResponse(data.user);
}
