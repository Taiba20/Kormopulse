import { apiCall } from "./apiBase";

export const alertService = {
  list,
  create,
  update,
  remove,
  test,
};

async function list() {
  return apiCall("get", "/alerts");
}

async function create(data) {
  return apiCall("post", "/alerts", data);
}

async function update(id, data) {
  return apiCall("patch", `/alerts/${id}`, data);
}

async function remove(id) {
  return apiCall("delete", `/alerts/${id}`);
}

async function test(id) {
  return apiCall("post", `/alerts/${id}/test`);
}
