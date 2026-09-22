// ============================================================================
// CYBER CORE: REGISTRO CENTRAL DE EXPERIÊNCIAS CONCEITUAIS (PLUGGABLE REGISTRY)
// ============================================================================

import React from 'react';
import type { ConceptExperienceProps } from './cyberCoreTypes';
import SubnettingInteractiveLab from '@/components/cybercore/labs/SubnettingInteractiveLab';
import TcpHandshakeLab from '@/components/cybercore/labs/TcpHandshakeLab';
import DnsResolutionLab from '@/components/cybercore/labs/DnsResolutionLab';
import GenericConceptExperience from '@/components/cybercore/labs/GenericConceptExperience';

// Registro desacoplado de componentes de experiência prática
export const CONCEPT_EXPERIENCE_REGISTRY: Record<string, React.ComponentType<ConceptExperienceProps>> = {
  'subnetting-cidr': SubnettingInteractiveLab as unknown as React.ComponentType<ConceptExperienceProps>,
  'tcp-3way-handshake': TcpHandshakeLab,
  'dns-resolution': DnsResolutionLab,
};

/**
 * Obtém o componente de experiência adequado para o conceito solicitado.
 * Se o conceito não possuir laboratório especializado, retorna o componente
 * de Fixação Conceitual (Active Retrieval) como fallback gracioso.
 */
export function getConceptExperience(slug: string): React.ComponentType<ConceptExperienceProps> {
  return CONCEPT_EXPERIENCE_REGISTRY[slug] || GenericConceptExperience;
}

/**
 * Permite que novos laboratórios registrem suas experiências dinamicamente
 * sem exigir alteração nos arquivos centrais do Cyber Core.
 */
export function registerConceptExperience(
  slug: string,
  component: React.ComponentType<ConceptExperienceProps>
): void {
  CONCEPT_EXPERIENCE_REGISTRY[slug] = component;
}

/**
 * Verifica se um conceito possui laboratório dedicado ou se utilizará fallback.
 */
export function hasCustomExperience(slug: string): boolean {
  return Boolean(CONCEPT_EXPERIENCE_REGISTRY[slug]);
}

