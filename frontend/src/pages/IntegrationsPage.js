import React from 'react';
import PageLayout from '../components/PageLayout';
import IntegrationsMainComponent from '../components/pages/IntegrationsMainComponent';

export default function IntegrationsPage() {
  return (
    <PageLayout title="Integrations" subtitle="Manage system integrations">
      <IntegrationsMainComponent />
    </PageLayout>
  );
}