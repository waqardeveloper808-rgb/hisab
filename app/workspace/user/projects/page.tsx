import { ProjectsRegister } from "@/components/workspace/ProjectsRegister";

export default function UserProjectsPage() {
  return (
    <div data-inspector-route-owner="dedicated" data-inspector-register="projects" data-inspector-real-register="projects">
      <ProjectsRegister />
    </div>
  );
}