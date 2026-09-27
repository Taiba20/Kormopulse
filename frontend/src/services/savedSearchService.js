import { apiCall } from "./apiBase";

export const savedSearchService = {
  list,
  create,
  rename,
  remove,
};

async function list() {
  return apiCall("get", "/saved-searches");
}

async function create(data) {
  return apiCall("post", "/saved-searches", data);
}

async function rename(id, name) {
  return apiCall("patch", `/saved-searches/${id}`, { name });
}

async function remove(id) {
  return apiCall("delete", `/saved-searches/${id}`);
}
