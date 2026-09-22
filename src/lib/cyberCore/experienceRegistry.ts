// ============================================================================
// CYBER CORE: REGISTRO CENTRAL DE EXPERIÊNCIAS CONCEITUAIS (PLUGGABLE REGISTRY)
// ============================================================================

import React from 'react';
import type { ConceptExperienceProps } from './cyberCoreTypes';
import SubnettingInteractiveLab from '@/components/cybercore/labs/SubnettingInteractiveLab';
import TcpHandshakeLab from '@/components/cybercore/labs/TcpHandshakeLab';
import DnsResolutionLab from '@/components/cybercore/labs/DnsResolutionLab';
import GenericConceptExperience from '@/components/cybercore/labs/GenericConceptExperience';
import FirewallAclLab from '@/components/cybercore/labs/FirewallAclLab';
import IncidentResponseLab from '@/components/cybercore/labs/IncidentResponseLab';
import PkiChainLab from '@/components/cybercore/labs/PkiChainLab';
import KerberosFlowLab from '@/components/cybercore/labs/KerberosFlowLab';
import SiemCorrelationLab from '@/components/cybercore/labs/SiemCorrelationLab';
import WindowsEventLab from '@/components/cybercore/labs/WindowsEventLab';
import LinuxPermissionsLab from '@/components/cybercore/labs/LinuxPermissionsLab';
import CloudIamLab from '@/components/cybercore/labs/CloudIamLab';

// Registro desacoplado de componentes de experiência prática multidisciplinar
export const CONCEPT_EXPERIENCE_REGISTRY: Record<string, React.ComponentType<ConceptExperienceProps>> = {
  // NETWORKING
  'subnetting-cidr': SubnettingInteractiveLab as unknown as React.ComponentType<ConceptExperienceProps>,
  'tcp-3way-handshake': TcpHandshakeLab,
  'dns-resolution': DnsResolutionLab,
  // CYBERSECURITY
  'firewall-acl': FirewallAclLab,
  'incident-response-lifecycle': IncidentResponseLab,
  // CRYPTOGRAPHY
  'pki-certificate-chain': PkiChainLab,
  // IDENTITY
  'kerberos-auth-flow': KerberosFlowLab,
  // SOC
  'siem-log-correlation': SiemCorrelationLab,
  // WINDOWS
  'windows-event-analysis': WindowsEventLab,
  // LINUX
  'linux-file-permissions': LinuxPermissionsLab,
  // CLOUD
  'cloud-iam-permissions': CloudIamLab,
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

