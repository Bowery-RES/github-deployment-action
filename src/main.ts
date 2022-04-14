import * as core from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const context = github.context;
    const logUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const url = core.getInput("url", { required: false }) || logUrl;
    const environment =
      core.getInput("environment", { required: false }) || "production";
    const description = core.getInput("description", { required: false });

    const client = github.getOctokit(token).rest;

    const deployment = await client.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref: context.ref,
      required_contexts: [],
      environment,
      auto_merge: false,
      description,
    });
    const deploymentId = (deployment.data as any).id;
    if (!deploymentId) {
      throw new Error("'deploymentId' is not defined");
    }

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deploymentId,
      state: "pending",
      log_url: logUrl,
      environment_url: url,
    });

    core.setOutput("deployment_id", deploymentId.toString());
    core.saveState("deployment_id", deploymentId.toString());
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
