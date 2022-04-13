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
    const issue = github.context.issue;
    const deployment_id = core.getState("deployment_id");
    const defaultUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;

    const token = core.getInput("token", { required: true });
    const url = core.getInput("target_url", { required: false }) || defaultUrl;
    const logUrl = core.getInput("log_url", { required: false }) || defaultUrl;
    const description = core.getInput("description", { required: false }) || "";

    const client = github.getOctokit(token).rest;

    const workflowRun = await client.actions.listJobsForWorkflowRun({
      ...issue,
      run_id: context.runId,
    });

    const currentJob = workflowRun.data.jobs.find(
      (job) => job.run_id === context.runId && job.status === "in_progress"
    );

    const failedStep = currentJob?.steps?.find(
      (step) => step.conclusion === "failure" && step.status === "completed"
    );
    if (failedStep) {
      core.error(`The following step failed, deployment is not succeded`);
      core.error(JSON.stringify(failedStep, null, 2));
    }

    const state = failedStep ? "failure" : "success";

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: parseInt(deployment_id),
      state,
      log_url: logUrl,
      description,
      environment_url: url,
      auto_inactive: true,
    });
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
