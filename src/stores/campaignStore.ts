import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CampaignDefinition, CampaignStatus, CampaignStepResult } from '@/types/campaign';

export interface CampaignStoreState {
  activeCampaignId: string | null;
  currentStepIndex: number;
  stepResults: Record<string, CampaignStepResult>;
  collectedIocs: string[];
  campaignStatus: CampaignStatus;
  startedAt: string | null;
  completedAt: string | null;

  // Actions
  startCampaign: (campaign: CampaignDefinition) => void;
  recordStepResult: (stepId: string, result: CampaignStepResult, evidenceReward?: string) => void;
  advanceToNextStep: (campaign: CampaignDefinition) => boolean;
  completeCampaign: () => void;
  resetCampaign: () => void;
}

export const useCampaignStore = create<CampaignStoreState>()(
  persist(
    (set, get) => ({
      activeCampaignId: null,
      currentStepIndex: 0,
      stepResults: {},
      collectedIocs: [],
      campaignStatus: 'not_started',
      startedAt: null,
      completedAt: null,

      startCampaign: (campaign: CampaignDefinition) => {
        const state = get();
        // If we are already running this campaign in progress, don't clobber unless not_started
        if (state.activeCampaignId === campaign.id && state.campaignStatus === 'in_progress') {
          return;
        }

        set({
          activeCampaignId: campaign.id,
          campaignStatus: 'in_progress',
          currentStepIndex: 0,
          stepResults: {},
          collectedIocs: [],
          startedAt: new Date().toISOString(),
          completedAt: null
        });
      },

      recordStepResult: (stepId: string, result: CampaignStepResult, evidenceReward?: string) => {
        set((state) => {
          const updatedResults = {
            ...state.stepResults,
            [stepId]: result
          };

          let updatedIocs = [...state.collectedIocs];
          if (result.correct && evidenceReward && !updatedIocs.includes(evidenceReward)) {
            updatedIocs.push(evidenceReward);
          }

          return {
            stepResults: updatedResults,
            collectedIocs: updatedIocs
          };
        });
      },

      advanceToNextStep: (campaign: CampaignDefinition) => {
        const state = get();
        const currentStep = campaign.steps[state.currentStepIndex];
        if (!currentStep) return false;

        const currentResult = state.stepResults[currentStep.id];
        // Only allow advance if current step is marked completed AND correct
        if (!currentResult || !currentResult.completed || !currentResult.correct) {
          return false;
        }

        const isLastStep = state.currentStepIndex >= campaign.steps.length - 1;
        if (isLastStep) {
          get().completeCampaign();
          return true;
        }

        set({
          currentStepIndex: state.currentStepIndex + 1
        });
        return true;
      },

      completeCampaign: () => {
        set({
          campaignStatus: 'completed',
          completedAt: new Date().toISOString()
        });
      },

      resetCampaign: () => {
        set({
          activeCampaignId: null,
          currentStepIndex: 0,
          stepResults: {},
          collectedIocs: [],
          campaignStatus: 'not_started',
          startedAt: null,
          completedAt: null
        });
      }
    }),
    {
      name: 'cybercert_campaign_session_v1',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
      })),
      partialize: (state) => ({
        activeCampaignId: state.activeCampaignId,
        currentStepIndex: state.currentStepIndex,
        stepResults: state.stepResults,
        collectedIocs: state.collectedIocs,
        campaignStatus: state.campaignStatus,
        startedAt: state.startedAt,
        completedAt: state.completedAt,
      }),
    }
  )
);
