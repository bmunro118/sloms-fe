import { AppModalConfirmOptions, AppModalRequest } from './types';

export interface AppModalController {
  openModal: (request: AppModalRequest) => void;
  closeModal: () => void;
  showInfo: (title: string, message?: string) => void;
  showSuccess: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showDanger: (title: string, message?: string) => void;
  showConfirm: (options: AppModalConfirmOptions) => Promise<boolean>;
}

let activeController: AppModalController | null = null;

export function registerAppModalController(controller: AppModalController | null): void {
  activeController = controller;
}

function withController<T>(action: (controller: AppModalController) => T): T | undefined {
  if (!activeController) {
    console.warn('[modal] AppModalProvider is not mounted yet.');
    return undefined;
  }

  return action(activeController);
}

export function openModal(request: AppModalRequest): void {
  withController((controller) => controller.openModal(request));
}

export function closeModal(): void {
  withController((controller) => controller.closeModal());
}

export function showInfoModal(title: string, message?: string): void {
  withController((controller) => controller.showInfo(title, message));
}

export function showSuccessModal(title: string, message?: string): void {
  withController((controller) => controller.showSuccess(title, message));
}

export function showWarningModal(title: string, message?: string): void {
  withController((controller) => controller.showWarning(title, message));
}

export function showDangerModal(title: string, message?: string): void {
  withController((controller) => controller.showDanger(title, message));
}

export function showConfirmModal(options: AppModalConfirmOptions): Promise<boolean> {
  const result = withController((controller) => controller.showConfirm(options));

  if (!result) {
    return Promise.resolve(false);
  }

  return result;
}
