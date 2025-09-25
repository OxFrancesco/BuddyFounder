import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export function DocumentManager() {
  const documents = useQuery(api.documents.getUserDocuments);
  const uploadDocument = useMutation(api.documents.uploadDocument);
  const updateDocument = useMutation(api.documents.updateDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);
  const generateUploadUrl = useMutation(api.documents.generateUploadUrl);

  const [isUploading, setIsUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Id<"documents"> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublic: true,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Extract text content based on file type
      let content = "";
      if (file.type.startsWith("text/")) {
        content = await file.text();
      } else {
        content = `Uploaded file: ${file.name} (${file.type})`;
      }

      await uploadDocument({
        title: formData.title || file.name,
        content: formData.content || content,
        fileId: storageId,
        fileType: file.type,
        isPublic: formData.isPublic,
      });

      toast.success("Document uploaded successfully!");
      setFormData({ title: "", content: "", isPublic: true });
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to upload document");
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      if (editingDoc) {
        await updateDocument({
          documentId: editingDoc,
          title: formData.title,
          content: formData.content,
          isPublic: formData.isPublic,
        });
        toast.success("Document updated successfully!");
        setEditingDoc(null);
      } else {
        await uploadDocument({
          title: formData.title,
          content: formData.content,
          isPublic: formData.isPublic,
        });
        toast.success("Document created successfully!");
      }
      
      setFormData({ title: "", content: "", isPublic: true });
      setShowAddForm(false);
    } catch (error) {
      toast.error("Failed to save document");
      console.error(error);
    }
  };

  const handleEdit = (doc: any) => {
    setFormData({
      title: doc.title,
      content: doc.content,
      isPublic: doc.isPublic,
    });
    setEditingDoc(doc._id);
    setShowAddForm(true);
  };

  const handleDelete = async (docId: Id<"documents">) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await deleteDocument({ documentId: docId });
      toast.success("Document deleted");
    } catch (error) {
      toast.error("Failed to delete document");
    }
  };

  const resetForm = () => {
    setFormData({ title: "", content: "", isPublic: true });
    setEditingDoc(null);
    setShowAddForm(false);
  };

  if (!documents) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Documents
            </h1>
            <p className="text-gray-600">
              Upload documents about yourself and your projects for AI chat
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            Add Document
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="text-lg font-semibold mb-4">
              {editingDoc ? "Edit Document" : "Add New Document"}
            </h3>
            
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Document title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Write about your projects, experience, ideas, or anything you'd like others to know about you..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700">
                  Make this document available for AI chat (others can ask your AI about this content)
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all"
                >
                  {editingDoc ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Or upload a file:</h4>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept=".txt,.md,.pdf,.doc,.docx"
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: .txt, .md, .pdf, .doc, .docx (max 10MB)
              </p>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="space-y-4">
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No documents yet
              </h3>
              <p className="text-gray-600">
                Add documents about yourself and your projects to enhance your AI chat experience
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">{doc.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      doc.isPublic 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {doc.isPublic ? "Public" : "Private"}
                    </span>
                    <button
                      onClick={() => handleEdit(doc)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2">
                  {doc.content.substring(0, 200)}
                  {doc.content.length > 200 && "..."}
                </p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
