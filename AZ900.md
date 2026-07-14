# ⚠️ Está um pouco bagunçado/misturado. Em breve será corrigido!

# ☁️ Guia de Estudos: AZ-900

> 🎯 **CORE** = saber de cor. 📘 **PROVÁVEL** = reconhecer bem. 📎 **EXTRA** = só o nome.
> Formato otimizado para o padrão da prova: "o que este serviço faz?" e "qual a melhor solução para X?"
> Ordem das seções segue a sequência do outline oficial da Microsoft — pode copiar para o caderno na ordem em que aparece.

---

## 🔴 Pontos Fracos e Pegadinhas Recorrentes

* **Hierarquia:** Tenant Root Group → Management Group (até **6 níveis**) → Subscription → Resource Group → Resource
* **GRS = LRS primária + LRS secundária assíncrona.** RPO < 15min. GZRS troca a primária por ZRS.
* **VPN Gateway costuma ser distrator.** Se a pergunta tem "sem internet" → ExpressRoute. "Pelo portal, sem expor porta" → Bastion. "Localização/dispositivo" → Conditional Access. "DNS global" → Traffic Manager.
* **V/F com "apenas / exclusivamente / automaticamente / somente"** → quase sempre **FALSO**.
* **Duas opções funcionam?** Escolha a mais simples/barata (NSG antes de Firewall, Tags antes de Resource Group).
* **App/servidor já existe e quer subir "com mínimo esforço"** → **IaaS** (lift-and-shift), nunca SaaS. SaaS é sempre para consumir algo pronto de terceiros, nunca para migrar o que você já tem.
* **Azure SQL Database é baseado em SQL Server e usa T-SQL.** Se a pergunta mencionar "código aberto / open-source / MySQL / PostgreSQL", a resposta é a família **Azure Database for [BD]**, nunca SQL Database.
* **LRS/ZRS/GRS são de Storage (dados). Availability Set/Zone são de Compute (VMs).** Não troque os dois mundos.
* **Questões de múltipla seleção, drag-and-drop e múltiplas lacunas são tudo-ou-nada** — acertar 3 de 4 vale **zero**. Ainda assim, sempre preencha sua melhor tentativa completa; deixar em branco também vale zero, então não há vantagem em "jogar seguro".

---

# 🎯 PARTE 1 — CORE

## 1. Conceitos de Nuvem

**Computação em nuvem:** entrega de recursos de TI (servidores, armazenamento, banco de dados, rede, software) **sob demanda pela internet**, com pagamento conforme o uso — sem comprar ou manter hardware físico próprio.

| Modelo de implantação | Descrição | Quando usar |
|---|---|---|
| Pública | Provedor externo, compartilhada, sem custo inicial de hardware | Cargas variáveis, evitar CapEx |
| Privada | Uso exclusivo de 1 organização | Dado muito sensível, regulação rígida |
| Híbrida | Combina pública + privada | Dado sensível fica local, processamento pesado vai pra nuvem |
| Multicloud | 2+ provedores **públicos** diferentes (Azure + AWS) | Evitar dependência de 1 único fornecedor |

**CapEx** (físico, antecipado, deprecia) vs **OpEx** (consumo, contínuo, sem custo inicial).

**Escalabilidade** (capacidade de ajustar — pode ser manual) vs **Elasticidade** (ajuste **automático** por demanda). Vertical = mais CPU/RAM na mesma máquina. Horizontal = mais instâncias. Controle de capacidade pode ser **manual** (equipe ajusta no portal) ou **Auto Scale** (regra automática, ex: "CPU > 70% → adiciona 1 VM").

**Computação sem servidor (Serverless):** você só escreve o código — não provisiona, não gerencia e não paga por servidor ocioso. Escala automaticamente (inclusive até zero) e cobra somente pelo tempo de execução real. No Azure: **Azure Functions**, **Logic Apps**. "Sem servidor" não significa que não existe hardware — significa que ele está 100% abstraído para você.

| Benefício da Nuvem | O que significa |
|---|---|
| Alta Disponibilidade | App continua funcionando com mínimo downtime, garantido por SLA |
| Confiabilidade | Recursos replicados globalmente — se 1 região falha, outras continuam atendendo |
| Previsibilidade | De custo (calculadoras) e de desempenho (monitoramento estruturado) |
| Segurança | Provedor oferece as ferramentas nativas; implementar corretamente é responsabilidade do cliente |
| Gerenciabilidade | Gerenciar via portal, CLI, PowerShell ou automação |

| Modelo de serviço | Cliente gerencia | Provedor gerencia | Quando usar |
|---|---|---|---|
| **IaaS** | SO, patches, apps, dados | Hardware, datacenter | Migrar app existente com mínimo esforço (lift-and-shift), precisa de controle total do SO |
| **PaaS** | Apps, dados | SO, runtime, hardware | Focar só no código, sem gerenciar servidor |
| **SaaS** | Dados apenas | Tudo (apps, SO, hardware) | Consumir um software pronto de terceiros (e-mail, CRM) |

> ⚠️ **Dados, identidades e contas de acesso são SEMPRE do cliente**, em qualquer modelo.
> 🎯 App/servidor **já existe** e quer subir "com mínimo esforço" → **IaaS**, nunca SaaS (SaaS é sempre para consumir algo pronto de terceiros, nunca para migrar o que você já tem).

---

## 2. Infraestrutura Global

**Datacenter → Zona de Disponibilidade → Região → Par de Regiões → Geografia**

| Proteção contra | Solução |
|---|---|
| Falha de rack físico | **Availability Set** |
| Falha de datacenter inteiro | **Availability Zone** |
| Falha de região inteira | **Par de Regiões** (≥480km, updates alternados) |

> 🌐 **Brasil/LGPD:** Par padrão do Brazil South é South Central US (EUA). Para manter dados no país: LRS/ZRS local, ou usar **Brazil Southeast** (Rio) como par nacional.
> ⚠️ Escolha de região **não é automática** por localização do usuário — é decisão sua (latência, custo, compliance).

---

## 3. Hierarquia Organizacional

**Management Group** (até 6 níveis, políticas/orçamento multi-subscription) → **Subscription** (cobrança) → **Resource Group** (pasta lógica; deletar RG deleta tudo dentro) → **Resource**. Políticas e RBAC são **herdados** de cima para baixo.

### Regras de Escopo — o que precisa "estar junto" para funcionar

| Regra | Detalhe |
|---|---|
| VM + Availability Set | Precisam estar no **mesmo grupo de recursos e região** do Availability Set. A VM só entra **no momento da criação** — não dá pra adicionar uma VM já existente depois. |
| VM + VM Scale Set | As instâncias nascem automaticamente na mesma região/grupo de recursos do Scale Set — você não escolhe. |
| Resource Group | Pertence a **exatamente 1 Subscription**. Nunca é compartilhado entre assinaturas. |
| Recursos dentro de 1 Resource Group | **Podem estar em regiões diferentes entre si!** A "região" do RG é só onde fica o metadado — não trava a região dos recursos dentro dele. |
| Subscription | Associada a **1 único Management Group por vez** (mas um MG pode conter várias subscriptions). |
| VNet | Vive em **1 única região** — não pode ser multi-região. Uma sub-rede pertence a exatamente 1 VNet. |
| VNet Peering | **Não exige** mesma região (Global Peering existe) nem mesma subscription. Só não é transitivo. |
| Virtual Network Gateway (VPN S2S) | Precisa estar dentro de uma sub-rede especial chamada **GatewaySubnet**, na VNet que ele conecta. |
| Storage Account | Define **1 região única** para tudo que está dentro dela — Blob/Files/Queue/Table não podem "morar" em regiões diferentes na mesma conta. |
| Azure Policy / RBAC / Resource Locks | Aplicados a um **escopo** (Management Group, Subscription, Resource Group ou Resource) — a regra é **herdada** por tudo que está abaixo daquele escopo. |

> 🎯 Perguntas do tipo "qual a condição para X funcionar" quase sempre testam um destes pares: **mesmo grupo de recursos**, **mesma subscription**, **mesma região**, ou "**precisa ser criado junto**, não dá pra adicionar depois".

---

## 4. Computação

| Serviço | O que faz | Gatilho |
|---|---|---|
| **Azure VMs** | IaaS, controle total do SO | — |
| **Availability Set** | Distribui VMs entre fault domains (3) e update domains (20) no mesmo datacenter | "falha de hardware local" |
| **VM Scale Sets** | Grupo de VMs idênticas com autoscale | "escalar automaticamente" |
| **App Service** | PaaS para web apps/APIs/backends mobile — Azure cuida de patches, SO e servidores, você foca só no código. Sempre rodando, cobra por hora | "hospedar site/API contínua" |
| **Azure Functions** | Serverless — executa código disparado por evento, você não gerencia servidor nenhum, cobra só pelo tempo de execução | "tarefa pontual por evento" |
| **ACI** | 1 contêiner isolado, rápido | "1 contêiner simples" |
| **AKS** | Orquestração de contêineres em escala | "múltiplos contêineres, microsserviços" |
| **Azure Virtual Desktop** | Desktop virtualizado na nuvem | "trabalho remoto, BYOD" |

### Comparar tipos de computação

| Tipo | Isolamento | Tempo de início | Quando usar |
|---|---|---|---|
| **VM** | Total (SO completo) | Minutos | Controle total do SO, apps legadas |
| **Container** | Processo (compartilha kernel do host) | Segundos | Apps portáveis, microsserviços |
| **Função (serverless)** | Por execução | Instantâneo | Tarefa curta disparada por evento |

### Recursos necessários para criar uma VM

**Grupo de recursos + região** · **Tamanho/SKU** (vCPU/RAM) · **Imagem de SO** (Windows/Linux) · **Disco de SO** (+ discos de dados opcionais) · **Rede** (VNet/sub-rede, NIC, IP público opcional) · **Credenciais de administrador**.

### Opções de hospedagem de aplicativos

| Opção | Controle do SO? | Esforço de gerenciamento |
|---|---|---|
| **VM** | Total | Alto — você gerencia tudo |
| **Contêiner (ACI/AKS)** | Nenhum (empacotado) | Médio — só a imagem, não o SO |
| **App Service (Web App)** | Nenhum | Baixo — só o código |

---

## 5. Redes

**VNet:** rede privada isolada com espaço de endereçamento próprio (CIDR) — recursos dentro dela se comunicam entre si por padrão. **Sub-rede:** divide a VNet em segmentos menores. **IP Público:** necessário para um recurso se comunicar com a internet.

| Solução | Conecta | Via internet? |
|---|---|---|
| **VNet Peering** | 2 VNets do Azure (backbone Microsoft) | Não |
| **VPN P2S** | 1 dispositivo ↔ Azure | Sim |
| **VPN S2S** | Rede inteira ↔ Azure | Sim |
| **ExpressRoute** | Rede inteira ↔ Azure, link privado dedicado | Não |

> ⚠️ **VNet Peering não é transitivo** (A↔B↔C não conecta A↔C automaticamente). Cobrado por GB de entrada+saída.
> ⚠️ **VPN S2S tem 2 gateways:** *Virtual Network Gateway* = lado do Azure. *Local Network Gateway* = objeto que **representa** a rede on-premises dentro do Azure.
> ⚠️ ExpressRoute **não criptografa por padrão**.

**Azure Bastion:** RDP/SSH a VMs **pelo portal**, sem IP público na VM, sem cliente VPN.

| Segurança | Faz o quê | Use quando |
|---|---|---|
| **NSG** | Regras por porta/IP, grátis | Porta específica (22, 80, 445) |
| **Azure Firewall** | Stateful, FQDN, DNAT, threat intel, logs de auditoria | Precisa de recurso avançado que NSG não tem |

| Balanceamento | Camada | Escopo | Use quando |
|---|---|---|---|
| **Load Balancer** | 4 (TCP/UDP) | Regional | Tráfego simples entre VMs |
| **App Gateway** 📘 | 7 (HTTP/S) | Regional | Roteamento por URL + WAF |
| **Front Door** 📘 | 7 (HTTP/S) | Global | Multi-região + CDN + WAF |
| **Traffic Manager** 📘 | DNS | Global | Failover por DNS, sem inspecionar tráfego |

**Azure DNS:** zonas públicas e privadas, integrado a ARM/RBAC/logs, não depende de ExpressRoute.
**CDN:** cache de conteúdo estático em servidores próximos ao usuário — reduz latência e economiza banda.

---

## 6. Storage

| Tipo | Para quê |
|---|---|
| **Blob** | Dados não estruturados massivos (imagens, vídeo, backup, big data) |
| **Files** | Compartilhamento via **SMB/NFS**, monta como unidade de rede |
| **Queue** | Mensagens para desacoplar apps |
| **Table** | NoSQL chave-atributo simples |
| **Disk** | Discos anexados a VMs |

### Contas de Armazenamento (Storage Account)

Toda Storage do Azure vive dentro de uma **Storage Account** — o "contêiner" que agrupa Blob/Files/Queue/Table, define um nome único global, a região e as configurações de acesso.

| Tipo de conta | Suporta | Uso |
|---|---|---|
| **General-purpose v2** | Blob, Files, Queue, Table, Disk | Padrão recomendado para a maioria dos cenários |
| **BlockBlobStorage** | Só Blob (blocos) | Alta transação, camada Premium |
| **FileStorage** | Só Files | Cargas de arquivo com I/O intenso, camada Premium |

**Camadas de desempenho:** **Standard** (discos HDD, mais barato, uso geral) vs **Premium** (discos SSD, baixa latência, cargas intensas).

### Qual escolher — cenário → serviço

| Cenário | Serviço |
|---|---|
| Fotos, vídeos, logs, backups genéricos, dados binários em massa | **Blob Storage** |
| Compartilhamento de pasta de rede para vários usuários/VMs (like um "drive" corporativo) | **Azure Files** (SMB/NFS) |
| Desacoplar comunicação entre partes de uma aplicação (fila de mensagens) | **Queue Storage** |
| Dados simples chave-valor, sem necessidade de relacionamento, baixo custo | **Table Storage** |
| Disco persistente para 1 VM específica (SO ou dados) | **Disk Storage** |
| Big data/analytics com hierarquia de pastas e processamento em escala (Spark/Hadoop) | **Azure Data Lake Storage (ADLS Gen2)** 📎 — é Blob Storage + namespace hierárquico |

> 🎯 Se a pergunta menciona só "big data" ou "arquivos binários em massa" **sem** falar de hierarquia de pastas ou motor analítico (Spark/Databricks/Synapse) → a resposta no nível AZ-900 é **Blob Storage** puro, não ADLS.
> ⚠️ **Table Storage vs Cosmos DB:** os dois são NoSQL, mas Table Storage é chave-atributo simples e barato; Cosmos DB é multi-modelo, distribuído globalmente, com RU/s e SLA de 99,999%. Se a pergunta menciona qualquer coisa "global", "multi-região" ou "RU/s", é Cosmos DB — não Table Storage.

| Camada Blob | Custo guardar | Custo acessar | Retenção mínima |
|---|---|---|---|
| Hot | Alto | Baixo | Acesso frequente |
| Cool | Médio | Médio | 30 dias |
| Cold | Baixo | Alto | 90 dias |
| Archive | Muito baixo | Muito alto (horas p/ reidratar) | 180 dias |

### Redundância — decore o prefixo

**L**ocally / **Z**one / **G**eo / **RA** = Read-Access. Sufixo sempre **RS** = Redundant Storage.

| Sigla | Onde ficam as cópias | Cópias | Protege contra |
|---|---|---|---|
| **LRS** | 1 datacenter | 3 | Falha de disco/servidor |
| **ZRS** | 3 zonas na região primária | 3 | Queda de datacenter |
| **GRS** | LRS primária + LRS secundária (região par) | 6 | Falha de região |
| **GZRS** | **ZRS** primária + LRS secundária | 6 | Datacenter + região |
| **RA-GRS / RA-GZRS** | Igual GRS/GZRS + leitura na secundária a qualquer momento | 6 | Idem + leitura HA |

> Replicação entre regiões é sempre **assíncrona**, RPO < 15min. Sem RA, só lê a secundária em failover. Durabilidade crescente: **LRS < ZRS < GRS < GZRS**.

---

## 7. Identidade, Acesso e Segurança

**Microsoft Entra ID:** autenticação + autorização, baseado em nuvem (funciona também híbrido com AD on-prem — nunca "exclusivo local").

**Microsoft Entra Domain Services** 📘: fornece serviços de domínio **gerenciados** — domain join, Group Policy, LDAP, autenticação Kerberos/NTLM — compatíveis com Active Directory tradicional, **sem você precisar implantar, gerenciar ou aplicar patch em controladores de domínio**. Ideal para lift-and-shift de apps legadas que dependem de AD.

> ⚠️ **3 serviços "Entra" — não confundir:** **Entra ID** (identidade nativa da nuvem) · **Entra Domain Services** (AD gerenciado, sem controladores próprios) · **Entra Connect Sync** (sincroniza Entra ID com um AD on-prem que você já tem).

| Recurso | O que é |
|---|---|
| **SSO (Single Sign-On)** | Login único dá acesso a múltiplos sistemas sem reautenticar |
| **MFA (Multi-Factor Authentication)** | 2+ fatores: algo que sabe (senha) + possui (celular/token) + é (biometria) |
| **Passwordless** | Login sem senha — chave física de segurança, Windows Hello ou Microsoft Authenticator |

**Azure Key Vault:** cofre para 3 tipos de segredo — **Secrets** (senhas, connection strings, tokens), **Keys** (chaves de criptografia) e **Certificates** (SSL/TLS). Apps acessam via API (geralmente com Managed Identity) sem hardcodar credencial no código. Gatilho: "segredos, chaves, certificados".

**RBAC = Role-Based Access Control** (não confundir com siglas inventadas). 3 componentes: **Função** (permissões) + **Atribuição** (vincula à identidade) + **Escopo** (onde vale).

| Função | Delega acesso? |
|---|---|
| **Owner** | Sim — controle total |
| **Contributor** | Não — cria/gerencia tudo, mas não delega |
| **Reader** | Só visualiza |
| **User Access Administrator** | Só gerencia acessos |

**Azure Policy:** foca no **o quê** pode ser feito (não em quem) — bloquear região, exigir HTTPS, obrigar tags.

**Tags:** chave-valor para organizar/rastrear custo **sem mover ou alterar** o recurso. ("Atribuir custo sem mudar local" → Tags, não Resource Group.)

---

## 8. Ferramentas de Gerenciamento

**ARM** processa todas as operações (Portal, CLI, PowerShell, APIs passam por ele).

| Ferramenta | Quando |
|---|---|
| **Portal** | Interface web visual — funciona em **qualquer navegador moderno** (Edge, Chrome, Firefox, Safari), responsivo para desktop e mobile |
| Azure CLI | Bash/Linux |
| Azure PowerShell | Windows |
| Cloud Shell | Navegador, sem instalar |

**ARM Templates** (JSON) e **Bicep** (linguagem mais legível — **compila para ARM Templates**, não é motor separado).

> 🎯 **ARM/Bicep vs VM Scale Sets — pegadinha comum:**
>
> | Cenário | Solução |
> |---|---|
> | Capturar uma configuração já existente (de uma VM, rede, etc.) e replicar automaticamente para criar N recursos iguais, sem repetir manualmente | **ARM Template / Bicep** |
> | Criar e gerenciar automaticamente um **grupo de VMs idênticas**, com autoscale e balanceamento de carga embutidos | **VM Scale Sets** |
>
> Os dois têm "criação automatizada e repetível" no centro, mas ARM/Bicep é uma ferramenta genérica de IaC (funciona para qualquer tipo de recurso — VM, rede, storage), enquanto VM Scale Sets é um recurso específico do Azure já pronto para gerenciar frotas de VMs com escala automática. Internamente, um Scale Set também usa um template — a diferença é o escopo (genérico vs específico para VMs) e o autoscale embutido.
>
> ⚠️ **Não confundir com Azure Policy:** Policy define regras de **governança** (bloquear região, exigir tag) que valem para qualquer recurso dentro de um escopo — ele não replica a configuração específica de um recurso existente.

**Resource Locks** (não fazem parte do Policy, são herdados): **CanNotDelete** (modifica, não deleta) / **ReadOnly** (nem modifica nem deleta).

**Azure Migrate:** hub de discovery + avaliação + migração de workloads on-prem (servidores físicos/VMs, bancos de dados, apps web, área de trabalho virtual).

**Azure Arc** 📘: estende o gerenciamento do Azure (Policy, RBAC, monitoramento) para recursos que **não estão fisicamente no Azure** — servidores on-premises, VMs em outras nuvens (AWS/GCP), clusters Kubernetes em qualquer lugar. O recurso externo passa a aparecer no portal do Azure como se fosse nativo, permitindo aplicar **Azure Policy** e **Defender for Cloud** nele também. Gatilho: "gerenciar servidor fora do Azure", "governança híbrida/multi-cloud".

---

## 9. Monitoramento

| Serviço | Monitora |
|---|---|
| **Azure Monitor** | **Seus recursos** (métricas, logs, alertas) |
| **Application Insights** | Anomalias em **apps web** |
| **Service Health** | **Plataforma Azure** — 3 categorias: Problemas de Serviço / Manutenção Planejada / Avisos de Integridade |
| **Advisor** | Recomendações em 5 categorias: Custo, Segurança, Confiabilidade, Desempenho, Excelência Operacional |

> 🎯 KQL (Kusto Query Language) = sempre **Log Analytics**.
> ⚠️ Advisor: **Custo** = $ desperdiçado (redimensionar). **Excelência Operacional** = boas práticas/automação. Não troque os dois.
> 📘 **Azure Monitor Alerts:** regra que dispara notificação/ação automaticamente quando uma métrica ou log cruza um limite (ex: "avisar se CPU > 90% por 5 min").

---

## 10. Custos e Suporte

**Azure Cost Management:** ferramenta gratuita para monitorar gastos atuais, criar orçamentos e disparar alertas quando o consumo se aproxima do limite.

**Pricing Calculator** (estima antes de criar) vs **TCO Calculator** (compara on-prem vs nuvem antes de migrar).

| Plano de Suporte | Indicação | Support API |
|---|---|---|
| Basic | Grátis, só faturamento | ❌ |
| Developer | Dev/teste, email comercial | ❌ |
| Standard | Produção, 24/7 | ❌ |
| **Professional Direct** | Crítico | ✅ |
| Enterprise | Grandes corporações | ✅ |

**SLA:** 99% ≈ 7h down/mês · 99,9% ≈ 44min · 99,99% ≈ 4min (zonas diferentes = 99,99%).

---

═══════════════════════════════

# 📘 PARTE 2 — PROVÁVEL

## 11. Identidade Avançada

* **Conditional Access:** políticas "se isso, então aquilo" no login (localização, dispositivo, risco → permitir/MFA/bloquear).
* **PIM:** acesso administrativo temporário e sob aprovação (just-in-time).
* **Entra Connect Sync:** sincroniza AD on-prem com Entra ID → **identidade híbrida**.
* **B2B** (parceiros externos acessam **recursos do Azure** com identidade própria) vs **B2C** (clientes finais autenticam num **app**, sem permissão no Azure).

## 12. Segurança Estratégica

**Defesa em Profundidade** (7 camadas: física → identidade → perímetro → rede → computação → aplicação → dados).
**Zero Trust:** verificar sempre / privilégio mínimo / assumir violação.
**Defender for Cloud:** avalia sua postura de segurança com um **Secure Score** e detecta ameaças (logins anômalos, malware, configurações inseguras). Funciona multi-cloud (Azure, AWS, GCP) e híbrido via Arc. Tem tier gratuito + planos pagos (Defender plans) por serviço.

## 13. Redes Avançadas

| Recurso | IP privado na VNet? |
|---|---|
| **Private Endpoint** | Sim — 100% privado |
| **Service Endpoint** | Não — só estende identidade da VNet pela backbone pública |

**Azure DDoS Protection:** Basic (grátis) / Standard (pago, avançado). **WAF:** protege contra OWASP Top 10, embutido no App Gateway ou Front Door.

| Diagnóstico | Serve para |
|---|---|
| **Network Watcher** | Diagnóstico de rede (não é auditoria) |
| **Azure Firewall Logs** | Auditoria detalhada de tráfego |
| **Activity Log** | "Quem fez o quê" administrativamente |

## 14. Monitoramento Avançado

| Serviço | Função |
|---|---|
| **Activity Log** | Ações administrativas (criar/deletar recurso) |
| **Log Analytics + KQL** | Consulta e correlaciona logs |
| **Azure Monitor Metrics** | Performance (CPU, RAM, IOPS) |
| **Sentinel** 📎 | SIEM/SOAR — correlação de segurança |

## 15. Bancos de Dados — catálogo completo

> ⚠️ **Correção importante:** Azure SQL Database é baseado em **SQL Server** (T-SQL) — **não é** a mesma coisa que a família open-source abaixo.

| Serviço | Engine | Gatilho |
|---|---|---|
| **Azure SQL Database** | SQL Server | "T-SQL", "ACID", "integridade referencial" |
| **SQL Managed Instance** | SQL Server (quase 100% compatível) | "lift-and-shift de SQL Server on-prem" |
| **Azure Database for MySQL/PostgreSQL** | Open-source | "código aberto", "MySQL", "PostgreSQL" |
| ~~Azure Database for MariaDB~~ | Open-source | Em descontinuação (set/2025) |
| **Cosmos DB** | NoSQL multi-modelo (SQL, Mongo, Cassandra, Gremlin, Table) | "RU/s", "multi-master", "JSON", "indexação automática", "SLA 99,999%" |
| **Stream Analytics** | Streaming simples | "tempo real", "IoT" |
| **Data Factory** | ETL — unidade principal é o **Pipeline** | "orquestrar fluxo de dados" |
| Databricks 📎 | Spark: batch+streaming+ML | — |
| Synapse Analytics 📎 | Data warehouse + BI | — |
| HDInsight 📎 | Hadoop/Spark "cru" | — |

## 16. Continuidade e Compliance

| Serviço | Faz o quê |
|---|---|
| **Azure Backup** | Cria e mantém backups (snapshots) de VMs, arquivos e bancos de dados para recuperação pontual. Responde a "perdi um arquivo, restaure". Não é cópia entre contas. |
| **Azure Site Recovery** | Replica VMs e servidores inteiros para uma região secundária e orquestra o failover automático em caso de desastre. Responde a "a região caiu, troca tudo pra outra região agora". |
| **Microsoft Purview** 🎯 | Suíte de governança de dados: **descobre, cataloga e classifica** dados sensíveis em fontes on-premises, multi-cloud e SaaS. Cria um mapa unificado dos dados, rastreia origem/linhagem e ajuda a identificar informações protegidas por LGPD/GDPR. Inclui o módulo **Compliance Manager**, que avalia aderência a normas externas (GDPR, LGPD, ISO, SOC, HIPAA) e atribui um **Compliance Score** com ações recomendadas. **Não armazena nem transfere dados** — só identifica, classifica e avalia. É o único item de governança/compliance citado nominalmente no outline oficial — priorize este. |
| Service Trust Portal 📎 | Portal público (separado do Purview) com relatórios de auditoria e certificações **da própria Microsoft** — não avalia o cliente, sem score. Menos provável de cair isoladamente. |

## 17. Regiões Soberanas — Government e China

| Aspecto | **Azure Government** | **Azure China** |
|---|---|---|
| Opera | Microsoft (pessoal americano triado) | **21Vianet** (parceiro chinês licenciado) |
| Para quem | Só governo dos EUA + parceiros qualificados | Mercado geral chinês |
| Motivo | Compliance de segurança nacional (FedRAMP, DoD, ITAR) | Lei chinesa exige operação local |
| Portal | Separado | Separado (portal.azure.cn) |

> 🎯 "Isolado, exclusivo do governo dos EUA" → Government. "Operado por empresa local, lei da China exige" → China.

## 18. Custos Avançados

**Ingress** sempre grátis. **Egress** para internet e entre regiões: cobrado. Mesma zona: grátis.

| Opção | Desconto | Risco |
|---|---|---|
| **Reservations** | Até 72% | Compromisso de SKU/região fixo |
| **Savings Plans** | Até 65% | Compromisso de gasto/hora, mais flexível |
| **Spot VMs** | Até 90% | Pode ser interrompida |
| **Hybrid Benefit** | 40-55% | Precisa licença com Software Assurance |

## 19. Transferência de Dados

| Ferramenta | Quando |
|---|---|
| **AzCopy** | CLI para TBs entre Storage Accounts, automatizável em scripts |
| **Azure Storage Explorer** | App gráfica (GUI) para navegar, subir/baixar e gerenciar Blob/Files/Queue/Table visualmente, sem linha de comando |
| **Azure File Sync** | Sincronizar pastas Windows on-prem ↔ Azure Files |
| **Azure Data Box** | Internet lenta, 50TB+, dispositivo físico |
| **Azure Migrate** | Discovery + avaliação de migração (não move dados sozinho) |

## 20. Detalhes Técnicos

* **Update Domain:** grupo de VMs reiniciadas juntas em manutenção (não confundir com Fault Domain, que é sobre hardware/energia compartilhados).
* **RPO** = quanto dado pode perder · **RTO** = quanto tempo até restaurar.
* Storage é sempre criptografado em repouso com **AES-256**, não desativável.
* Rede: IaaS = controle total · PaaS = parcial · SaaS = nenhum.

---

═══════════════════════════════

# 📎 PARTE 3 — EXTRA (só reconhecer o nome)

| Serviço | Gatilho |
|---|---|
| **Azure Batch** | HPC, processamento paralelo, clusters automáticos |
| **Container Apps (ACA)** | Kubernetes serverless, sem gerenciar cluster |
| **SignalR Service** | Comunicação em tempo real (WebSockets) |
| **Azure Blueprints** | Pacote Policy+RBAC+ARM (em descontinuação) |
| **Queue Storage + Functions** | Trigger nativo (mensagem → dispara função) |
| **Service Bus / Event Grid / Event Hubs** | Mensageria empresarial / pub-sub / ingestão massiva de eventos |
| **SAS Token / Access Keys** | Ainda expõem acesso — Private Endpoint é mais seguro |
| **VNet Peering regional vs global** | Mesma região vs regiões diferentes (mesma feature) |

---

# 📑 Apêndice A — Glossário PT-BR

| Inglês | Português |
|---|---|
| Service Health | Integridade do Serviço |
| Advisor | Assistente |
| Availability Set/Zone | Conjunto/Zona de Disponibilidade |
| Network Security Group | Grupo de Segurança de Rede |
| Health Advisories | Avisos de Integridade |
| Service Endpoints | Pontos de Extremidade de Serviço |
| Spot VMs | VMs Spot |
| Hybrid Benefit | Benefício Híbrido |
| Management/Resource Groups | Grupos de Gerenciamento/Recursos |
| Reservations | Reservas |
| VNet Peering | Emparelhamento de VNet |
| Local Network Gateway | Gateway de Rede Local |
| Application Gateway | Gateway de Aplicativo |
| Service Trust Portal | Central de Confiabilidade |
| Fault/Update Domain | Domínio de Falha/Atualização |
| Resource Locks | Bloqueios de Recursos |
| Key Vault | Cofre de Chaves |
| Conditional Access | Acesso Condicional |
| PIM | Gerenciamento de Identidade Privilegiada |
| Defender for Cloud | Defender para Nuvem |
| Compliance Manager | Gerenciador de Conformidade |
| Tags | Marcas |
| Tenant / Subscription | Locatário / Assinatura |
| Scale Sets | Conjuntos de Dimensionamento |
| Defense in Depth | Defesa em Profundidade |
| WAF | Firewall de Aplicativos Web |
| Front Door | Porta da Frente |
| Traffic Manager | Gerenciador de Tráfego |
| SSO / MFA | Logon Único / Autenticação Multifator |
| Activity Log | Log de Atividades |
| Network Watcher | Inspetor de Rede |
| Site Recovery | Recuperação de Site |
| Storage Explorer | Gerenciador de Armazenamento |
| Domain Services | Serviços de Domínio |
| Serverless | Sem Servidor |
| Azure Arc | Azure Arc (não traduz) |

---

# 📑 Apêndice B — Cola de Prova (última leitura antes de entrar)

### Palavras-gatilho mais decisivas

| Vê isso... | É isso |
|---|---|
| "sem expor porta", "pelo portal" | Bastion |
| "FQDN", "DNAT", "auditoria profunda" | Azure Firewall |
| "porta específica" | NSG |
| "URL/hostname + WAF regional" | App Gateway |
| "global + CDN" | Front Door |
| "DNS + failover" | Traffic Manager |
| "IP privado na VNet" | Private Endpoint |
| "1 dispositivo" | VPN P2S |
| "rede inteira, internet" | VPN S2S |
| "sem internet, dedicado" | ExpressRoute |
| "RU/s, multi-master, JSON" | Cosmos DB |
| "T-SQL" | Azure SQL Database |
| "código aberto, MySQL/PostgreSQL" | Azure Database for [BD] |
| "Pipeline, ETL" | Data Factory |
| "KQL, Kusto" | Log Analytics |
| "quem deletou" | Activity Log |
| "anomalias em app" | Application Insights |
| "DR, failover de VM" | Site Recovery |
| "Score de conformidade" | Compliance Manager (módulo do Purview) |
| "catalogar dados internos" | Purview |
| "servidor fora do Azure, governança híbrida" | Azure Arc |
| "AD gerenciado, sem controladores próprios" | Entra Domain Services |
| "sem gerenciar servidor, paga só execução" | Serverless (Functions/Logic Apps) |
| "governo dos EUA isolado" | Azure Government |
| "operado por empresa chinesa" | Azure China |
| "TBs entre contas" | AzCopy |
| "internet não comporta" | Data Box |
| "HPC" | Azure Batch |
| "tempo real, WebSockets" | SignalR |
| "K8s sem gerenciar cluster" | Container Apps |

### Estratégia durante a prova

1. Lê a **última linha** primeiro — geralmente tem o verbo-chave.
2. Sublinha mentalmente **"EXCETO"** e **"NÃO"**.
3. Múltipla seleção / drag-and-drop / múltiplas lacunas = **tudo-ou-nada**. Preenche sempre sua melhor tentativa completa.
4. Duas opções plausíveis → a **mais simples e barata** vence.
5. Não relê 10 vezes. Primeira impressão geralmente acerta. Marca pra revisar e segue.


---

## 📘 Azure Container Apps

Executa aplicações em **containers** sem precisar gerenciar Kubernetes. A Azure cuida da infraestrutura e da escalabilidade automaticamente (inclusive até zero).

**Gatilho da prova:** microsserviços, containers sem Kubernetes, serverless para containers.

---

## 📘 Azure Functions × Logic Apps

| Azure Functions | Logic Apps |
|----------------|------------|
| Executa código | Fluxo visual (Low-code/No-code) |
| Lógica personalizada | Integra serviços |
| Disparada por eventos | Automatiza processos |
| Requer programação | Não exige programação |

### Gatilhos da prova

- **"Executar código"**, **"função"**, **"evento"** → **Azure Functions**
- **"Fluxo"**, **"integração"**, **"Outlook → Teams → SharePoint"** → **Logic Apps**

---

## 📘 Azure Firewall × Application Gateway

| Azure Firewall | Application Gateway |
|----------------|---------------------|
| Protege a **rede (VNet)** | Gerencia e protege **aplicações Web** |
| Camadas **3 e 4** (IP, portas, protocolos) | Camada **7** (HTTP/HTTPS) |
| Filtra qualquer tipo de tráfego | Balanceia tráfego HTTP/HTTPS |
| Controla entrada, saída e tráfego entre VNets | Pode utilizar **WAF** |

### WAF (Web Application Firewall)

Protege aplicações Web contra ataques como:

- SQL Injection
- Cross-Site Scripting (XSS)

**Gatilho da prova:** proteção contra ataques Web → **WAF**.

---

## 📘 Azure Data Lake Storage

É um **Blob Storage otimizado para Big Data e Analytics**.

Diferença:

- **Blob Storage:** armazenamento de arquivos.
- **Data Lake Storage:** armazenamento para processamento de grandes volumes de dados por ferramentas analíticas (Spark, Databricks, Synapse).

---

## 📘 Azure Data Factory

Serviço utilizado para **integrar, mover e transformar dados** entre diferentes fontes.

Cria **pipelines** de dados.

Exemplo:

SQL Server → Blob Storage → Data Lake → Azure SQL Database

**Gatilhos da prova:**

- ETL
- Migração de dados
- Integração de dados
- Pipeline

→ **Azure Data Factory**

---

## 📘 Azure Stream Analytics

Processa dados **em tempo real**.

Exemplo:

Sensores IoT → Analisar temperatura → Gerar alerta.

**Gatilhos da prova:**

- Streaming
- Tempo real
- Eventos em tempo real

---

## 📘 Domain Controller

Servidor responsável por autenticar usuários e computadores em um domínio.

Armazena:

- Usuários
- Senhas
- Grupos
- Políticas (Group Policy)

No Azure, o **Microsoft Entra Domain Services** fornece esses serviços de domínio de forma gerenciada.

---

## 📘 O que afeta os custos da Azure?

- Região
- Tipo do recurso
- SKU
- Tempo de utilização
- Quantidade utilizada
- Transferência de **saída (Egress)**

### Transferência de dados

- ✅ **Entrada (Ingress):** normalmente gratuita.
- 💲 **Saída (Egress):** normalmente cobrada.

---

## 📘 Reservations × Spot VMs

| Reservations | Spot VMs |
|---------------|-----------|
| Desconto por compromisso de 1 ou 3 anos | Usa capacidade ociosa da Azure |
| Não são interrompidas | Podem ser removidas a qualquer momento |
| Ideal para produção | Ideal para testes e cargas interrompíveis |

---

## 📘 Azure Migrate × TCO Calculator

| Azure Migrate | TCO Calculator |
|----------------|----------------|
| Migra recursos para a Azure | Compara custos entre on-premises e Azure |
| Descobre e avalia servidores | Estima economia |
| Planejamento da migração | Planejamento financeiro |

---

## 📘 Azure DNS × Traffic Manager

| Azure DNS | Traffic Manager |
|------------|----------------|
| Hospeda zonas DNS | Distribui usuários entre regiões |
| Resolve nomes de domínio | Balanceamento por DNS |
| Não faz failover | Faz failover automaticamente |

### Gatilho da prova

- **Resolver nomes** → Azure DNS.
- **Escolher a melhor região / Failover** → Traffic Manager.

---

## 📘 Azure Resource Manager (ARM)

O **Azure Resource Manager (ARM)** é o serviço responsável por criar, atualizar e excluir recursos na Azure.

Tudo passa pelo ARM:

- Portal Azure
- Azure CLI
- PowerShell
- REST API
- ARM Templates
- Bicep

O ARM verifica:

- Permissões (RBAC)
- Azure Policy
- Resource Group
- Região

Só então executa a operação.

---

# 📚 Comparações que mais caem

| Comparação | Diferença |
|------------|-----------|
| NSG × Azure Firewall | NSG filtra portas/IP; Firewall oferece proteção avançada da rede. |
| Azure Firewall × Application Gateway | Firewall protege a rede; Application Gateway protege aplicações Web. |
| Application Gateway × Front Door | App Gateway é regional; Front Door é global. |
| Azure DNS × Traffic Manager | DNS resolve nomes; Traffic Manager escolhe a melhor região e faz failover. |
| Blob Storage × Data Lake | Blob armazena arquivos; Data Lake é otimizado para Big Data e Analytics. |
| Blob Storage × Azure Files | Blob = objetos; Files = compartilhamento SMB/NFS. |
| Azure Functions × Logic Apps | Código × Fluxo de trabalho. |
| VM Scale Sets × Availability Set | Escalabilidade × Alta disponibilidade. |
| Azure SQL Database × SQL Managed Instance | Banco PaaS × Compatibilidade quase total com SQL Server. |
| Management Group × Resource Group | Organiza Subscriptions × Organiza Recursos. |
| ARM × Bicep | Motor de gerenciamento × Linguagem de IaC. |
| Azure Migrate × TCO Calculator | Migração × Comparação de custos. |

---

# 🚨 Macetes de Última Hora

- **Resource Group** → Organiza recursos.
- **Management Group** → Organiza Subscriptions.
- **Subscription** → Cobrança.
- **Tags** → Organização e controle de custos.
- **RBAC** → Quem pode fazer.
- **Azure Policy** → O que pode ser feito.
- **Resource Locks** → Impedem alteração ou exclusão.
- **NSG** → Filtra portas e IPs.
- **Azure Firewall** → Proteção avançada da rede.
- **Application Gateway** → Balanceador para aplicações Web.
- **WAF** → Protege aplicações Web contra ataques.
- **Traffic Manager** → DNS global com failover.
- **Front Door** → Balanceamento HTTP/HTTPS global.
- **Azure Data Factory** → Integra e move dados.
- **Azure Stream Analytics** → Processa dados em tempo real.
- **Azure Functions** → Executa código por evento.
- **Logic Apps** → Automatiza fluxos.
- **VM Scale Sets** → Escala automaticamente um grupo de VMs.
- **Reservations** → Desconto por compromisso.
- **Spot VMs** → Capacidade ociosa com baixo custo.
- **Azure Migrate** → Migração para Azure.
- **TCO Calculator** → Compara custos de on-premises x Azure.
- **ARM** → Gerencia todos os recursos da Azure.

---

# 📘 Logs e Monitoramento

Os serviços de monitoramento costumam ser confundidos na prova. A principal diferença é **o que cada um monitora**.

| Serviço | O que monitora | Quando usar |
|---------|----------------|-------------|
| **Azure Monitor** | Todos os recursos da Azure | Monitoramento geral (métricas, logs e alertas) |
| **Log Analytics** | Logs coletados pelo Azure Monitor | Consultar e analisar logs usando KQL |
| **Activity Log** | Ações administrativas na Azure | Descobrir quem criou, alterou ou excluiu recursos |
| **Resource Logs (Diagnostic Logs)** | Eventos de um recurso específico | Ver o que aconteceu dentro de um recurso |
| **Application Insights** | Aplicações | Monitorar desempenho, erros e telemetria |

---

## 📊 Azure Monitor

É o serviço central de monitoramento da Azure.

Ele coleta:

- Métricas
- Logs
- Alertas

**Pense nele como o "hub" de monitoramento.**

---

## 🔍 Log Analytics

É o serviço utilizado para **consultar e analisar os logs** coletados pelo Azure Monitor.

Utiliza a linguagem **KQL (Kusto Query Language)**.

### Gatilho da prova

- Consultar logs.
- Pesquisar eventos.
- Executar consultas KQL.

➡️ **Log Analytics**

---

## 📋 Activity Log

Registra todas as **ações administrativas** realizadas na assinatura da Azure.

Exemplos:

- Criar uma Máquina Virtual.
- Excluir um Storage Account.
- Alterar um NSG.
- Criar um Resource Group.

### Gatilho da prova

"Quem criou?", "Quem alterou?", "Quem excluiu?"

➡️ **Activity Log**

---

## 📦 Resource Logs (Diagnostic Logs)

Registram eventos gerados por **um recurso específico**.

Exemplos:

- Azure Firewall bloqueou uma conexão.
- Key Vault recebeu uma tentativa de acesso.
- Storage Account recebeu uma solicitação.
- Application Gateway registrou uma requisição.

### Gatilho da prova

"O que aconteceu dentro do recurso?"

➡️ **Resource Logs**

---

## 📱 Application Insights

Monitora aplicações.

Coleta informações como:

- Tempo de resposta
- Número de requisições
- Exceções
- Dependências
- Disponibilidade

Ideal para aplicações Web e APIs.

### Gatilho da prova

"A aplicação está lenta."

"Quero identificar erros da API."

➡️ **Application Insights**

---

# 🎯 Como decorar

- 📊 **Azure Monitor** → Monitora tudo.
- 🔍 **Log Analytics** → Consulta logs (KQL).
- 👤 **Activity Log** → Quem fez o quê.
- 📦 **Resource Logs** → O que aconteceu dentro do recurso.
- 📱 **Application Insights** → Saúde e desempenho da aplicação.

---

# 📝 Comparações

| Comparação | Diferença |
|------------|-----------|
| **Azure Monitor × Log Analytics** | Monitor coleta dados; Log Analytics consulta os logs. |
| **Activity Log × Resource Logs** | Activity Log registra ações administrativas; Resource Logs registram eventos do recurso. |
| **Azure Monitor × Application Insights** | Azure Monitor monitora qualquer recurso; Application Insights monitora aplicações. |

> 💡 **Macete da prova:**
>
> - **Quem fez?** → **Activity Log**
> - **O que aconteceu no recurso?** → **Resource Logs**
> - **Consultar logs?** → **Log Analytics**
> - **Monitorar aplicação?** → **Application Insights**
> - **Monitoramento geral?** → **Azure Monitor**
