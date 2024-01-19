export const Storage = {
  ACCESS_TOKEN: "zzstudio_access_token",
  // refreash
  REFRESH_TOKEN: "zzstudio_refresh_token",
  // user info
  USER_INFO: "zzstudio_user_info",
};

// 服务器端code码
export const ServiceError = {
  // 未登录 没有传token
  UNLOGIN: 1000,
  // 未授权 传了token, 权限不足
  UNAUTHORIZED: 1001,
  // 服务器错误
  SERVER_ERROR: 1002,
  // 登录access_token过期
  ACCESS_TOKEN_EXPIRED: 1003,
  // refresh_token过期
  REFRESH_TOKEN_EXPIRED: 1004,
};
