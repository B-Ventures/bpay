// Simple toast notification utility

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

class ToastManager {
  private container: HTMLElement | null = null;
  
  constructor() {
    // Create toast container when this utility is initialized
    if (typeof document !== 'undefined') {
      this.initContainer();
    }
  }
  
  private initContainer() {
    // Check if container already exists
    this.container = document.getElementById('toast-container');
    
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.style.position = 'fixed';
      this.container.style.top = '1rem';
      this.container.style.right = '1rem';
      this.container.style.zIndex = '9999';
      this.container.style.display = 'flex';
      this.container.style.flexDirection = 'column';
      this.container.style.gap = '0.5rem';
      document.body.appendChild(this.container);
    }
  }
  
  public toast(options: ToastOptions) {
    if (typeof document === 'undefined') return;
    
    // Ensure container exists
    if (!this.container) {
      this.initContainer();
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.style.padding = '1rem';
    toastEl.style.borderRadius = '0.375rem';
    toastEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    toastEl.style.marginBottom = '0.5rem';
    toastEl.style.width = '18rem';
    toastEl.style.maxWidth = '100%';
    toastEl.style.transition = 'all 0.2s ease-in-out';
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(1rem)';
    
    // Set background color based on variant
    switch (options.variant) {
      case 'destructive':
        toastEl.style.backgroundColor = '#f87171';
        toastEl.style.color = 'white';
        break;
      case 'success':
        toastEl.style.backgroundColor = '#22c55e';
        toastEl.style.color = 'white';
        break;
      default:
        toastEl.style.backgroundColor = 'white';
        toastEl.style.color = '#374151';
        toastEl.style.border = '1px solid #e5e7eb';
    }
    
    // Create title
    const titleEl = document.createElement('div');
    titleEl.style.fontWeight = 'bold';
    titleEl.style.marginBottom = options.description ? '0.25rem' : '0';
    titleEl.textContent = options.title;
    toastEl.appendChild(titleEl);
    
    // Create description if provided
    if (options.description) {
      const descEl = document.createElement('div');
      descEl.style.fontSize = '0.875rem';
      descEl.textContent = options.description;
      toastEl.appendChild(descEl);
    }
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '0.5rem';
    closeButton.style.right = '0.5rem';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '1rem';
    closeButton.style.cursor = 'pointer';
    closeButton.style.opacity = '0.5';
    closeButton.style.color = 'inherit';
    closeButton.addEventListener('click', () => {
      this.removeToast(toastEl);
    });
    toastEl.appendChild(closeButton);
    
    // Add toast to container
    toastEl.style.position = 'relative';
    this.container?.appendChild(toastEl);
    
    // Animate in
    setTimeout(() => {
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove after duration
    const duration = options.duration || 5000;
    setTimeout(() => {
      this.removeToast(toastEl);
    }, duration);
  }
  
  private removeToast(toastEl: HTMLElement) {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(1rem)';
    
    setTimeout(() => {
      if (toastEl.parentNode === this.container) {
        this.container?.removeChild(toastEl);
      }
    }, 300);
  }
}

const toastManager = new ToastManager();

export function useToast() {
  return { toast: toastManager.toast.bind(toastManager) };
}