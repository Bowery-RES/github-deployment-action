import * as core from "@actions/core";
import * as github from "@actions/github";

type DeploymentState =
  | "error"
  | "failure"
  | "inactive"
  | "in_progress"
  | "queued"
  | "pending"
  | "success";

async function run() {
  try {
    const context = github.context;
    const deployment_id = core.getState("deployment_id");
    const defaultUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const url = core.getInput("target_url", { required: false }) || defaultUrl;
    const logUrl = core.getInput("log_url", { required: false }) || defaultUrl;
    const description = core.getInput("description", { required: false }) || "";
    const environmentUrl =
      core.getInput("environment_url", { required: false }) || "";
    const state = "success" as DeploymentState;

    const client = github.getOctokit(token).rest;

    await client.repos.createDeploymentStatus({
      ...context.repo,
      auto_inactive: true,
      deployment_id: parseInt(deployment_id),
      state,
      log_url: logUrl,
      target_url: url,
      description,
      environment_url: environmentUrl,
    });
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
