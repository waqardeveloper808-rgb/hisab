import type { WorkspaceModule, WorkspaceResource } from "@/data/workspace";

export function mapWorkspaceHref(href: string, basePath: string) {
  if (!href.startsWith("/workspace")) {
    return href;
  }

  return `${basePath}${href.slice("/workspace".length) || ""}`;
}

export function mapWorkspaceResource<T extends WorkspaceResource>(resource: T, basePath: string): T {
  if (!resource.href) {
    return resource;
  }

  return {
    ...resource,
    href: mapWorkspaceHref(resource.href, basePath),
  };
}

export function mapWorkspaceModule(module: WorkspaceModule, basePath: string): WorkspaceModule {
  return {
    ...module,
    href: mapWorkspaceHref(module.href, basePath),
    primaryAction: {
      ...module.primaryAction,
      href: mapWorkspaceHref(module.primaryAction.href, basePath),
    },
    secondaryAction: module.secondaryAction
      ? {
        ...module.secondaryAction,
        href: mapWorkspaceHref(module.secondaryAction.href, basePath),
      }
      : undefined,
    sections: {
      register: module.sections.register?.map((resource) => mapWorkspaceResource(resource, basePath)),
      books: module.sections.books?.map((resource) => mapWorkspaceResource(resource, basePath)),
      templates: module.sections.templates?.map((resource) => mapWorkspaceResource(resource, basePath)),
      reports: module.sections.reports?.map((resource) => mapWorkspaceResource(resource, basePath)),
      help: module.sections.help?.map((resource) => mapWorkspaceResource(resource, basePath)),
    },
  };
}