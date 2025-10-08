"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Github,
  Calendar,
  Tag,
  Lightbulb,
  TrendingUp,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import {
  createPortfolioProject,
  getPortfolioProjects,
  updatePortfolioProject,
  deletePortfolioProject,
  generateProjectDescription,
  getPortfolioStats,
  generatePortfolioRecommendations,
} from "@/actions/portfolio";

const ProjectCard = ({ project, onEdit, onDelete }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {project.description}
          </p>
        </div>
        <div className="flex space-x-2 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(project)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(project.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <Badge variant="outline">{project.category}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.technologies?.map((tech, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(project.startDate).toLocaleDateString()} - 
              {project.endDate ? new Date(project.endDate).toLocaleDateString() : "Present"}
            </span>
          </div>
        </div>

        <div className="flex space-x-2">
          {project.projectUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.projectUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Live Demo
              </a>
            </Button>
          )}
          {project.githubUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-1" />
                Code
              </a>
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const ProjectForm = ({ project, onSave, onCancel, isOpen }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologies: [],
    projectUrl: "",
    githubUrl: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    category: "",
    isActive: true,
  });

  const [techInput, setTechInput] = useState("");

  const {
    loading: generateLoading,
    fn: generateDescription,
  } = useFetch(generateProjectDescription);

  useEffect(() => {
    if (project) {
      setFormData({
        ...project,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "",
        technologies: project.technologies || [],
      });
    } else {
      setFormData({
        title: "",
        description: "",
        technologies: [],
        projectUrl: "",
        githubUrl: "",
        imageUrl: "",
        startDate: "",
        endDate: "",
        category: "",
        isActive: true,
      });
    }
  }, [project]);

  const handleTechAdd = () => {
    if (techInput.trim() && !formData.technologies.includes(techInput.trim())) {
      setFormData(prev => ({
        ...prev,
        technologies: [...prev.technologies, techInput.trim()]
      }));
      setTechInput("");
    }
  };

  const handleTechRemove = (tech) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.title || !formData.technologies.length) {
      toast.error("Please provide project title and technologies first");
      return;
    }

    try {
      const description = await generateDescription(formData);
      setFormData(prev => ({ ...prev, description }));
      toast.success("Project description generated!");
    } catch (error) {
      toast.error("Failed to generate description");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {project ? "Edit Project" : "Add New Project"}
          </DialogTitle>
          <DialogDescription>
            {project ? "Update your project details" : "Add a new project to your portfolio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter project title"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web_app">Web Application</SelectItem>
                  <SelectItem value="mobile_app">Mobile Application</SelectItem>
                  <SelectItem value="data_science">Data Science</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <div className="flex space-x-2">
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your project..."
                rows={4}
                className="flex-1"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateDescription}
                disabled={generateLoading}
              >
                <Lightbulb className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Technologies Used</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Input
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="Add technology (e.g., React, Python)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTechAdd())}
                />
                <Button type="button" onClick={handleTechAdd}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                    <span>{tech}</span>
                    <button
                      type="button"
                      onClick={() => handleTechRemove(tech)}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectUrl">Live Demo URL</Label>
              <Input
                id="projectUrl"
                value={formData.projectUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, projectUrl: e.target.value }))}
                placeholder="https://your-project.com"
                type="url"
              />
            </div>
            <div>
              <Label htmlFor="githubUrl">GitHub URL</Label>
              <Input
                id="githubUrl"
                value={formData.githubUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                placeholder="https://github.com/username/project"
                type="url"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="imageUrl">Project Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://example.com/project-image.jpg"
              type="url"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {project ? "Update Project" : "Add Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default function PortfolioBuilder() {
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");

  const {
    loading: projectsLoading,
    fn: fetchProjects,
  } = useFetch(getPortfolioProjects);

  const {
    loading: createLoading,
    fn: createProject,
  } = useFetch(createPortfolioProject);

  const {
    loading: updateLoading,
    fn: updateProject,
  } = useFetch(updatePortfolioProject);

  const {
    loading: deleteLoading,
    fn: deleteProject,
  } = useFetch(deletePortfolioProject);

  const {
    loading: statsLoading,
    fn: fetchStats,
  } = useFetch(getPortfolioStats);

  const {
    loading: recommendationsLoading,
    fn: fetchRecommendations,
  } = useFetch(generatePortfolioRecommendations);

  useEffect(() => {
    fetchProjects().then(setProjects);
    fetchStats().then(setStats);
  }, []);

  const handleAddProject = () => {
    setEditingProject(null);
    setIsFormOpen(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  const handleSaveProject = async (projectData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, projectData);
        toast.success("Project updated successfully!");
      } else {
        await createProject(projectData);
        toast.success("Project added successfully!");
      }
      
      setIsFormOpen(false);
      setEditingProject(null);
      fetchProjects().then(setProjects);
      fetchStats().then(setStats);
    } catch (error) {
      toast.error("Failed to save project");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(projectId);
        toast.success("Project deleted successfully!");
        fetchProjects().then(setProjects);
        fetchStats().then(setStats);
      } catch (error) {
        toast.error("Failed to delete project");
      }
    }
  };

  const handleGetRecommendations = async () => {
    try {
      const recs = await fetchRecommendations();
      setRecommendations(recs);
      setActiveTab("recommendations");
      toast.success("Recommendations generated!");
    } catch (error) {
      toast.error("Failed to generate recommendations");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Builder</h1>
          <p className="text-gray-600">Showcase your projects and achievements</p>
        </div>
        <Button onClick={handleAddProject}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.totalProjects}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categories</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.categories).length}</p>
                </div>
                <Tag className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Technologies</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.technologies).length}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {projectsLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-4">Start building your portfolio by adding your first project</p>
                <Button onClick={handleAddProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Portfolio Recommendations</h3>
            <Button onClick={handleGetRecommendations} disabled={recommendationsLoading}>
              {recommendationsLoading ? "Generating..." : "Get Recommendations"}
            </Button>
          </div>

          {recommendations && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Missing Project Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recommendations.missingProjectTypes?.map((type, index) => (
                      <Badge key={index} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Project Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recommendations.projectIdeas?.map((idea, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{idea.title}</h4>
                          <Badge variant="outline">{idea.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{idea.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {idea.technologies?.map((tech, techIndex) => (
                            <Badge key={techIndex} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">{idea.impact}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProjectForm
        project={editingProject}
        onSave={handleSaveProject}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingProject(null);
        }}
        isOpen={isFormOpen}
      />
    </div>
  );
}
