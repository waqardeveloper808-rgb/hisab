import { controlModuleRegistry } from "@/backend/app/Support/Standards/v2/control-module-registry";

export const controlPointEngineModuleRegistry = [
  ...controlModuleRegistry.map((module) => ({
    module_code: module.code,
    module_name: module.name,
    module_description: module.description,
    parent_module: null,
    standards_source: ["backend/app/Support/Standards/v2/control-module-registry.ts"],
  })),
] as const;

export const controlPointEngineRequiredModuleCodes = controlPointEngineModuleRegistry.map((module) => module.module_code);

export const controlPointEngineRequiredModuleCodeSet = new Set(controlPointEngineRequiredModuleCodes);