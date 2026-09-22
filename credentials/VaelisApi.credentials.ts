import { ICredentialType, INodeProperties } from 'n8n-workflow';

export class VaelisApi implements ICredentialType {
  name = 'vaelisApi';
  displayName = 'Vaelis & TypeSafe API';
  documentationUrl = 'https://github.com/CubicMaldo/vaelis';
  properties: INodeProperties[] = [
    {
      displayName: 'Provider',
      name: 'provider',
      type: 'options',
      options: [
        { name: 'TypeSafe AI (Jev Cloud)', value: 'typesafe' },
        { name: 'Gemini Flash (System 2 Fallback)', value: 'gemini-flash' },
      ],
      default: 'typesafe',
    },
    {
      displayName: 'TypeSafe API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      displayOptions: {
        show: { provider: ['typesafe'] },
      },
      description: 'API Key del motor System 1',
    },
    {
      displayName: 'Custom Endpoint',
      name: 'endpoint',
      type: 'string',
      default: 'https://api.typesafe.ai',
      displayOptions: {
        show: { provider: ['typesafe'] },
      },
      description: 'Endpoint HTTP base (compatible con proxies o despliegues locales)',
    },
    {
      displayName: 'Gemini API Key (Fallback)',
      name: 'geminiApiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      description: 'API key usada si TypeSafe API no responde o si se activa el fallback',
    },
  ];
}
