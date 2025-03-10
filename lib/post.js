"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
function run() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const context = github.context;
            const issue = github.context.issue;
            const deployment_id = core.getState("deployment_id");
            const logUrl = `https://github.com/${context.repo.owner}/${context.repo.repo}/commit/${context.sha}/checks`;
            const token = core.getInput("token", { required: true });
            const url = core.getInput("url", { required: false });
            const description = core.getInput("description", { required: false }) || "";
            const client = github.getOctokit(token).rest;
            const workflowRun = yield client.actions.listJobsForWorkflowRun(Object.assign(Object.assign({}, issue), { run_id: context.runId }));
            const currentJob = workflowRun.data.jobs.find((job) => job.run_id === context.runId && job.status === "in_progress");
            const failedStep = (_a = currentJob === null || currentJob === void 0 ? void 0 : currentJob.steps) === null || _a === void 0 ? void 0 : _a.find((step) => step.conclusion === "failure" && step.status === "completed");
            if (failedStep) {
                core.error(`The following step failed, deployment is not succeded`);
                core.error(JSON.stringify(failedStep, null, 2));
            }
            const state = failedStep ? "failure" : "success";
            yield client.repos.createDeploymentStatus(Object.assign(Object.assign({}, context.repo), { deployment_id: parseInt(deployment_id), state, log_url: logUrl, description, environment_url: url, auto_inactive: true }));
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
run();
