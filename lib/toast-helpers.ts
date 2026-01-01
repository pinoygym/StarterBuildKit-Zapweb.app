import { toast } from "@/hooks/use-toast";

/**
 * Helper functions for common toast notification patterns
 * These provide consistent messaging across the application
 */

export const toastHelpers = {
  /**
   * Show a success toast notification
   */
  success: (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  },

  /**
   * Show an error toast notification
   */
  error: (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "destructive",
    });
  },

  /**
   * Show a generic info toast notification
   */
  info: (message: string, description?: string) => {
    toast({
      title: message,
      description,
      variant: "default",
    });
  },

  /**
   * Common success messages
   */
  created: (entityName: string) => {
    toast({
      title: "Success",
      description: `${entityName} created successfully`,
    });
  },

  updated: (entityName: string) => {
    toast({
      title: "Success",
      description: `${entityName} updated successfully`,
    });
  },

  deleted: (entityName: string) => {
    toast({
      title: "Success",
      description: `${entityName} deleted successfully`,
    });
  },

  /**
   * Common error messages
   */
  createError: (entityName: string, error?: string) => {
    toast({
      title: "Error",
      description: error || `Failed to create ${entityName}`,
      variant: "destructive",
    });
  },

  updateError: (entityName: string, error?: string) => {
    toast({
      title: "Error",
      description: error || `Failed to update ${entityName}`,
      variant: "destructive",
    });
  },

  deleteError: (entityName: string, error?: string) => {
    toast({
      title: "Error",
      description: error || `Failed to delete ${entityName}`,
      variant: "destructive",
    });
  },

  fetchError: (entityName: string, error?: string) => {
    toast({
      title: "Error",
      description: error || `Failed to fetch ${entityName}`,
      variant: "destructive",
    });
  },

  /**
   * Validation error
   */
  validationError: (message: string = "Please check your input and try again") => {
    toast({
      title: "Validation Error",
      description: message,
      variant: "destructive",
    });
  },

  /**
   * Network error
   */
  networkError: () => {
    toast({
      title: "Network Error",
      description: "Please check your internet connection and try again",
      variant: "destructive",
    });
  },

  /**
   * Insufficient stock error
   */
  insufficientStock: (productName: string) => {
    toast({
      title: "Insufficient Stock",
      description: `Not enough stock available for ${productName}`,
      variant: "destructive",
    });
  },

  /**
   * Permission error
   */
  permissionError: () => {
    toast({
      title: "Permission Denied",
      description: "You don't have permission to perform this action",
      variant: "destructive",
    });
  },
};
