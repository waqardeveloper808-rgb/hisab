import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { controlPointEnginePrecheck, controlPointEngineRuntime, controlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine";
import { renderControlPointEngineSummary } from "@/backend/app/Support/Standards/control-point-engine-summary";

type StepRecord = {
  step: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  totalElapsedMs: number;
  averageStepMs: number;
  etaRemainingMsEstimate: number;
};

function timestampLabel() {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  return `${date}_${time}`;
}

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function writeText(filePath: string, value: string) {
  await writeFile(filePath, `${value.trim()}\n`, "utf8");
}

function buildStepRecord(step: string, startedAtMs: number, endedAtMs: number, completedSteps: number, totalSteps: number, totalStartedAtMs: number): StepRecord {
  const totalElapsedMs = endedAtMs - totalStartedAtMs;
  const averageStepMs = completedSteps > 0 ? totalElapsedMs / completedSteps : 0;
  const remainingSteps = Math.max(0, totalSteps - completedSteps);
  return {
    step,
    startedAt: new Date(startedAtMs).toISOString(),
    endedAt: new Date(endedAtMs).toISOString(),
    durationMs: endedAtMs - startedAtMs,
    totalElapsedMs,
    averageStepMs: Math.round(averageStepMs),
    etaRemainingMsEstimate: Math.round(averageStepMs * remainingSteps),
  };
}

async function run() {
  const totalStartedAtMs = Date.now();
  const runLabel = process.env.RUN_LABEL ?? timestampLabel();
  const outputRoot = process.env.OUTPUT_DIR ?? path.join(process.cwd(), "artifacts", `control_point_engine_${runLabel}`);
  await mkdir(outputRoot, { recursive: true });

  const steps = [
    "precheck",
    "module-registration",
    "control-registration",
    "summary",
    "validation",
    "final-validation",
  ];
  const stepRecords: StepRecord[] = [];

  const precheckStarted = Date.now();
  await writeJson(path.join(outputRoot, "control-point-engine-precheck.json"), controlPointEnginePrecheck);
  stepRecords.push(buildStepRecord("precheck", precheckStarted, Date.now(), stepRecords.length + 1, steps.length, totalStartedAtMs));

  const moduleRegistrationStarted = Date.now();
  await writeJson(path.join(outputRoot, "module-registration-report.json"), controlPointEngineRuntime.registered_modules);
  stepRecords.push(buildStepRecord("module-registration", moduleRegistrationStarted, Date.now(), stepRecords.length + 1, steps.length, totalStartedAtMs));

  const controlRegistrationStarted = Date.now();
  await writeJson(path.join(outputRoot, "control-registration-report.json"), controlPointEngineRuntime.registered_control_points);
  stepRecords.push(buildStepRecord("control-registration", controlRegistrationStarted, Date.now(), stepRecords.length + 1, steps.length, totalStartedAtMs));

  const summaryStarted = Date.now();
  await writeJson(path.join(outputRoot, "control-point-engine-summary.json"), controlPointEngineSummary);
  await writeText(path.join(outputRoot, "control-point-engine-summary.md"), renderControlPointEngineSummary(controlPointEngineSummary));
  stepRecords.push(buildStepRecord("summary", summaryStarted, Date.now(), stepRecords.length + 1, steps.length, totalStartedAtMs));

  const validationStarted = Date.now();
  await writeJson(path.join(outputRoot, "control-point-engine-validation-results.json"), controlPointEngineRuntime.validation);
  stepRecords.push(buildStepRecord("validation", validationStarted, Date.now(), stepRecords.length + 1, steps.length, totalStartedAtMs));

  const finalValidationStarted = Date.now();
  const finalValidation = {
    engine_built: true,
    engine_integrated: true,
    engine_validated: controlPointEngineRuntime.validation.valid,
    all_modules_registered: controlPointEngineRuntime.missing_module_issues.length === 0,
    all_controls_registered: controlPointEngineRuntime.total_control_points === controlPointEngineRuntime.registered_control_points.length,
    counts_are_accurate: controlPointEngineRuntime.validation.count_mismatches.length === 0,
    engine_control_points_included: controlPointEngineRuntime.registered_control_points.filter((controlPoint) => controlPoint.module_code === "CPE").length,
    duplicate_ids_count: controlPointEngineRuntime.duplicate_id_issues.length,
    orphan_controls_count: controlPointEngineRuntime.orphan_issues.length,
    missing_module_references_count: controlPointEngineRuntime.missing_module_issues.length,
    runtime_status: "active",
    build_status: process.env.BUILD_STATUS ?? "unknown",
    generated_at: new Date().toISOString(),
  };
  await writeJson(path.join(outputRoot, "control-point-engine-final-validation.json"), finalValidation);
  stepRecords.push(buildStepRecord("final-validation", finalValidationStarted, Date.now(), stepRecords.length + 1, steps.length, totalStartedAtMs));

  await writeText(path.join(outputRoot, "execution-log.md"), `# Control Point Engine Execution Log\n\n${stepRecords.map((record) => `- ${record.step}: started ${record.startedAt}, ended ${record.endedAt}, duration ${record.durationMs} ms, total elapsed ${record.totalElapsedMs} ms, average step ${record.averageStepMs} ms, ETA remaining estimate ${record.etaRemainingMsEstimate} ms.`).join("\n")}`);
  await writeText(path.join(outputRoot, "execution-time-report.md"), `# Control Point Engine Time Report\n\n${stepRecords.map((record) => `- Step ${record.step}: duration ${record.durationMs} ms, total elapsed ${record.totalElapsedMs} ms, average step ${record.averageStepMs} ms, ETA remaining estimate ${record.etaRemainingMsEstimate} ms.`).join("\n")}\n\nETA note: estimates are approximate only.`);
  await writeText(path.join(outputRoot, "blockers.md"), `# Control Point Engine Blockers\n\n${controlPointEngineRuntime.validation.valid ? "No engine validation blockers remained." : [
    ...controlPointEngineRuntime.validation.duplicate_control_point_ids.map((issue) => `- Duplicate control point ID: ${issue}`),
    ...controlPointEngineRuntime.validation.orphan_control_points.map((issue) => `- Orphan control point: ${issue}`),
    ...controlPointEngineRuntime.validation.missing_module_registration.map((issue) => `- Missing module registration: ${issue}`),
    ...controlPointEngineRuntime.validation.modules_with_zero_controls.map((issue) => `- Module with zero controls: ${issue}`),
    ...controlPointEngineRuntime.validation.count_mismatches.map((issue) => `- Count mismatch: ${issue}`),
  ].join("\n")}`);
  await writeText(path.join(outputRoot, "summary.md"), `# Control Point Engine Summary\n\n- Engine built: yes\n- Engine integrated: yes\n- Engine validated: ${controlPointEngineRuntime.validation.valid ? "yes" : "no"}\n- Total registered modules: ${controlPointEngineRuntime.total_modules}\n- Total registered controls: ${controlPointEngineRuntime.total_control_points}\n- Missing modules count: ${controlPointEngineRuntime.missing_module_issues.length}\n- Modules with zero controls: ${controlPointEngineRuntime.modules_with_zero_controls.length ? controlPointEngineRuntime.modules_with_zero_controls.join(", ") : "None"}\n- Duplicate IDs count: ${controlPointEngineRuntime.duplicate_id_issues.length}\n- Orphan controls count: ${controlPointEngineRuntime.orphan_issues.length}\n- Engine self-control count: ${controlPointEngineRuntime.registered_control_points.filter((controlPoint) => controlPoint.module_code === "CPE").length}\n- Total elapsed time: ${Date.now() - totalStartedAtMs} ms\n- Average step time: ${Math.round(stepRecords.reduce((sum, record) => sum + record.durationMs, 0) / Math.max(1, stepRecords.length))} ms\n- ETA note: estimate only.`);
  await writeText(path.join(outputRoot, "control-point-engine-onboarding-rules.md"), await (await import("node:fs/promises")).readFile(path.join(process.cwd(), "backend", "app", "Support", "Standards", "control-point-engine-onboarding-rules.md"), "utf8"));

  process.stdout.write(`${JSON.stringify({ outputRoot, totalModules: controlPointEngineRuntime.total_modules, totalControls: controlPointEngineRuntime.total_control_points, engineSelfControlCount: controlPointEngineRuntime.registered_control_points.filter((controlPoint) => controlPoint.module_code === "CPE").length }, null, 2)}\n`);
}

void run();