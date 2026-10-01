export type CampaignStatus = 'not_started' | 'in_progress' | 'completed';

export type CampaignLabFamily = 'pbq' | 'cybercore';

export interface CampaignStepResult {
  stepId: string;
  completed: boolean;
  correct: boolean;
  actionId?: string;
  errorType?: string;
  evidence?: string;
  completedAt: string;
}

export interface CampaignStep {
  id: string;
  labId: string;
  family: CampaignLabFamily;
  title: string;
  tacticalPhase?: string;
  previousContext?: string;
  briefing: string;
  objective: string;
  successCondition: string;
  evidenceReward?: string;
  technicalIoc?: string;
  campaignEvidence?: string;
}

export interface CampaignDefinition {
  id: string;
  codename: string;
  title: string;
  summary: string;
  description: string;
  targetVector: string;
  steps: CampaignStep[];
}
