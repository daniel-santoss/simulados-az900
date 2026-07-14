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
| **App Service** | PaaS para web apps/APIs/backends/WebJobs/Background Tasks mobile — Azure cuida de patches, SO e servidores, você foca só no código. Sempre rodando, cobra por hora | "hospedar site/API contínua" |
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
| **Azure Policy** | Auditar, Negar, Modificar, Herdar configurações |

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
| Compartilhamento de pasta de rede para vários usuários/VMs (like um "drive" corporativo). Pode ser montado simultaneamente por diversas VMs e computadores utilizando protocolo SMB ou NFS. | **Azure Files** (SMB/NFS) |
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

**RBAC = Role-Based Access Control** (não confundir com Azure Policy). 3 componentes: **Função** (permissões) + **Atribuição** (vincula à identidade) + **Escopo** (onde vale).

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
| **SQL Managed Instance** | SQL Server (oferece alta compatibilidade com SQL Server, facilitando migrações com poucas alterações) | "lift-and-shift de SQL Server on-prem" |
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
| **Azure Storage Explorer** | App gráfica (GUI) para navegar, subir/baixar e gerenciar Blob/Files/Queue/Table visualmente, sem linha de comando. Também permite copiar arquivos entre Storage Accounts utilizando interface gráfica. |
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

# 📘 Azure Container Apps

Executa aplicações em containers **sem precisar gerenciar Kubernetes**. O Azure cuida da infraestrutura, da escalabilidade e do balanceamento automaticamente.

## Gatilhos da prova

- Containers serverless
- Microsserviços
- Não quer gerenciar cluster Kubernetes
- Escalar automaticamente até zero

> Diferença:
>
> - **ACI** → executa um ou poucos containers isolados.
> - **Container Apps** → aplicações modernas, microsserviços e escalabilidade automática.
> - **AKS** → gerenciamento completo de clusters Kubernetes.

---

# 📘 Azure Functions × Logic Apps

| Azure Functions | Logic Apps |
|----------------|------------|
| Executa código | Fluxos visuais (Low-code/No-code) |
| Programação | Integração entre serviços |
| Disparada por eventos | Automatização de processos |
| Cobra por execução | Cobra pelas ações executadas |

## Gatilhos da prova

**Azure Functions**

- Executar código
- Evento
- Serverless
- Timer
- HTTP Trigger

**Logic Apps**

- Fluxo de aprovação
- Outlook → Teams → SharePoint
- Integração
- Automação sem programação

> Resumindo:
>
> **Código → Functions**
>
> **Fluxo → Logic Apps**

---

# 📘 Azure Firewall × Application Gateway × Front Door

| Serviço | Camada | Escopo | Quando usar |
|---------|---------|---------|--------------|
| Azure Firewall | L3/L4 | Rede | Proteger VNets |
| Application Gateway | L7 | Regional | Aplicações Web |
| Front Door | L7 | Global | Aplicações Web distribuídas mundialmente |

## Azure Firewall

Protege a rede.

Recursos importantes:

- Stateful Firewall
- DNAT
- FQDN Filtering
- Threat Intelligence
- Logs de auditoria

### Gatilhos

- Rede
- VNet
- Portas
- Protocolos
- DNAT
- FQDN

---

## Application Gateway

Balanceador HTTP/HTTPS regional.

Possui suporte ao **WAF**.

### Gatilhos

- HTTP
- HTTPS
- URL Routing
- Aplicações Web
- WAF

---

## Front Door

Balanceador HTTP/HTTPS global.

Também possui WAF.

Além disso:

- CDN integrado
- Failover global
- Baixa latência mundial

### Gatilhos

- Multi-região
- Global
- CDN
- WAF

---

## WAF

Protege aplicações Web contra ataques como:

- SQL Injection
- Cross-Site Scripting (XSS)
- Ataques do OWASP Top 10

Sempre aparece junto do:

- Application Gateway
- Front Door

---

# 📘 Azure Data Lake Storage

É uma extensão do Blob Storage voltada para Big Data.

Na prática:

**Blob Storage + Namespace Hierárquico**

Foi criado para trabalhar com:

- Spark
- Databricks
- Synapse
- Hadoop

## Diferença

| Blob Storage | Data Lake |
|---------------|-----------|
| Arquivos em geral | Big Data |
| Backup | Analytics |
| Fotos | Data Science |
| Vídeos | Machine Learning |

### Gatilho

Se falar apenas:

- Arquivos
- Imagens
- Backup
- Vídeos

➡️ Blob Storage

Se aparecer:

- Big Data
- Spark
- Databricks
- Analytics

➡️ Data Lake

---

# 📘 Azure Data Factory

Serviço responsável por mover, integrar e transformar dados.

Sua unidade principal é o **Pipeline**.

## Gatilhos

- ETL
- ELT
- Pipeline
- Migração de dados
- Integração de dados
- Orquestração

Exemplo:

SQL Server

↓

Blob Storage

↓

Data Lake

↓

Azure SQL Database

---

# 📘 Azure Stream Analytics

Processa dados em tempo real.

Recebe eventos continuamente.

Exemplos:

- IoT
- Sensores
- Telemetria
- Logs em tempo real

## Gatilhos

- Streaming
- Tempo real
- Eventos
- IoT

> Se a questão falar em "Pipeline", normalmente é **Data Factory**.
>
> Se falar em "tempo real", normalmente é **Stream Analytics**.

---

# 📘 Domain Controller

É o servidor responsável por autenticar usuários e computadores em um domínio Active Directory.

Armazena:

- Usuários
- Senhas
- Computadores
- Grupos
- Group Policies

No Azure quem fornece isso de forma gerenciada é o:

**Microsoft Entra Domain Services**

Você não precisa instalar nem manter Controladores de Domínio.

---

# 📘 O que afeta os custos da Azure?

O preço de um recurso depende principalmente de:

- Região
- Tipo do recurso
- SKU (camada/plano)
- Tempo de utilização
- Quantidade consumida
- Transferência de saída (Egress)

## Transferência de dados

- ✅ **Ingress (Entrada):** normalmente gratuita.
- 💲 **Egress (Saída):** normalmente cobrada.
- 🔄 Entre regiões diferentes também pode haver cobrança.

### Gatilhos da prova

- "Transferência para a Azure" → Ingress (grátis)
- "Transferência da Azure para Internet" → Egress (cobrado)

---

# 📘 Reservations × Savings Plans × Spot VMs

| Serviço | Quando usar | Desconto | Observação |
|----------|-------------|-----------|------------|
| Reservations | Uso previsível por 1 ou 3 anos | Até 72% | Compromisso com SKU/região |
| Savings Plan | Uso previsível, mas flexível | Até 65% | Compromisso de gasto por hora |
| Spot VMs | Testes e cargas interrompíveis | Até 90% | Pode ser interrompida pelo Azure |

### Gatilhos

- Produção por longo prazo → Reservations
- Produção com mais flexibilidade → Savings Plan
- Ambiente temporário → Spot VM

---

# 📘 Azure Migrate × TCO Calculator × Pricing Calculator

| Serviço | Função |
|----------|--------|
| Azure Migrate | Descobre, avalia e migra recursos |
| TCO Calculator | Compara custos On-Premises × Azure |
| Pricing Calculator | Estima quanto um ambiente Azure irá custar |

### Gatilhos

**Azure Migrate**

- Discovery
- Avaliação
- Migração
- Lift-and-shift

**Pricing Calculator**

- Quanto vai custar?
- Antes de criar

**TCO Calculator**

- Vale a pena migrar?
- Comparação financeira

---

# 📘 Azure DNS × Traffic Manager

| Azure DNS | Traffic Manager |
|------------|----------------|
| Resolve nomes DNS | Distribui usuários entre regiões |
| Hospeda zonas DNS | Balanceamento baseado em DNS |
| Não faz failover | Faz failover automaticamente |

### Gatilhos

Resolver nomes

➡️ Azure DNS

Escolher a melhor região

➡️ Traffic Manager

Failover global

➡️ Traffic Manager

---

# 📘 Azure Resource Manager (ARM)

O ARM é o serviço responsável por criar, atualizar e excluir recursos na Azure.

**Tudo passa pelo ARM:**

- Azure Portal
- Azure CLI
- Azure PowerShell
- REST API
- ARM Templates
- Bicep

Antes de executar uma operação o ARM verifica:

- Permissões (RBAC)
- Azure Policy
- Resource Locks
- Resource Group
- Região

Só depois cria ou altera o recurso.

### ARM Templates × Bicep

| ARM Template | Bicep |
|--------------|-------|
| JSON | Linguagem simplificada |
| Difícil de escrever | Muito mais legível |
| Motor de implantação | Compila para ARM Template |

> O motor continua sendo o ARM. O Bicep apenas gera ARM Templates.

---

# 📚 Comparações que mais caem

| Comparação | Diferença |
|------------|-----------|
| NSG × Azure Firewall | NSG controla portas/IP; Firewall oferece proteção avançada da rede. |
| Azure Firewall × Application Gateway | Firewall protege a rede; Application Gateway protege aplicações Web. |
| Application Gateway × Front Door | Regional × Global. |
| Azure DNS × Traffic Manager | Resolver nomes × Escolher a melhor região. |
| Blob Storage × Azure Files | Objetos × Compartilhamento SMB/NFS. |
| Blob Storage × Data Lake | Arquivos × Big Data. |
| Azure Functions × Logic Apps | Código × Fluxo de trabalho. |
| VM Scale Sets × Availability Set | Escalabilidade × Alta disponibilidade. |
| Azure SQL Database × SQL Managed Instance | Banco PaaS × Migração quase transparente do SQL Server. |
| SQL Database × Azure Database for PostgreSQL/MySQL | SQL Server × Bancos Open Source. |
| Management Group × Resource Group | Organiza Subscriptions × Organiza Recursos. |
| ARM × Bicep | Motor × Linguagem IaC. |
| Azure Migrate × Pricing Calculator | Migração × Estimativa de custos. |
| Azure Migrate × TCO Calculator | Migração × Comparação financeira. |
| AzCopy × Storage Explorer | CLI para grandes transferências × Interface gráfica para gerenciamento. |
| Azure Backup × Site Recovery | Backup de dados × Recuperação de desastre. |
| Azure Monitor × Application Insights | Todos os recursos × Aplicações. |
| Activity Log × Resource Logs | Quem fez × O que aconteceu. |

---

# 🚨 Macetes de Última Hora

- **Management Group** → Organiza Subscriptions.
- **Subscription** → Cobrança.
- **Resource Group** → Organiza Recursos.
- **Tags** → Organização e custos.
- **RBAC** → Quem pode fazer.
- **Azure Policy** → O que pode fazer.
- **Resource Locks** → Impede alteração/exclusão.
- **NSG** → Portas e IPs.
- **Azure Firewall** → Proteção avançada da rede.
- **Application Gateway** → Balanceador Web regional.
- **Front Door** → Balanceador Web global.
- **Traffic Manager** → DNS + Failover.
- **Azure DNS** → Resolver nomes.
- **Azure Data Factory** → ETL/Pipeline.
- **Stream Analytics** → Tempo real.
- **Azure Functions** → Código por evento.
- **Logic Apps** → Fluxos.
- **Container Apps** → Containers serverless.
- **VM Scale Sets** → Escalabilidade.
- **Availability Set** → Alta disponibilidade.
- **Reservations** → Desconto por compromisso.
- **Savings Plan** → Desconto flexível.
- **Spot VM** → Baixo custo com interrupção.
- **Azure Migrate** → Migração.
- **Pricing Calculator** → Estimar custos.
- **TCO Calculator** → Comparar custos.
- **ARM** → Gerencia todos os recursos da Azure.
---

# 📘 Logs e Monitoramento

Os serviços de monitoramento costumam aparecer juntos na prova. A principal diferença é **o que cada um monitora**.

| Serviço | O que faz | Gatilho da prova |
|----------|-----------|------------------|
| **Azure Monitor** | Plataforma central que coleta métricas, logs e gera alertas | "Monitorar recursos", "CPU", "alertas" |
| **Log Analytics** | Workspace onde os logs são armazenados e consultados com KQL | "Consultar logs", "KQL", "pesquisar eventos" |
| **Activity Log** | Registra ações administrativas na Subscription | "Quem criou?", "Quem excluiu?", "Quem alterou?" |
| **Resource Logs (Diagnostic Logs)** | Eventos internos gerados por um recurso específico | "O que aconteceu dentro do recurso?" |
| **Application Insights** | Monitora aplicações Web e APIs | "Aplicação lenta", "exceções", "telemetria" |
| **Service Health** | Informa problemas na própria plataforma Azure | "Falha da Microsoft", "manutenção", "incidente regional" |
| **Azure Advisor** | Recomenda melhorias para seus recursos | "Boas práticas", "economizar", "otimização" |

---

# 📊 Azure Monitor

É o serviço central de monitoramento da Azure.

Ele coleta:

- Métricas
- Logs
- Alertas

Pode monitorar praticamente qualquer recurso do Azure.

Além disso, envia dados para o **Log Analytics Workspace**, onde eles podem ser consultados.

### Azure Monitor Alerts

Permite disparar automaticamente:

- Email
- SMS
- Push
- Webhook
- Azure Function
- Logic App

Sempre que uma métrica ou log atender uma condição.

Exemplo:

CPU > 90% por 5 minutos

↓

Enviar alerta.

### Gatilhos

- CPU
- Memória
- Métricas
- Alertas
- Monitoramento geral

➡️ Azure Monitor

---

# 🔍 Log Analytics

É o serviço responsável por armazenar e consultar os logs coletados pelo Azure Monitor.

Utiliza:

**KQL (Kusto Query Language)**

Permite:

- Pesquisar eventos
- Correlacionar logs
- Criar dashboards
- Investigar problemas

### Gatilhos

- KQL
- Consultar logs
- Workspace
- Pesquisa

➡️ Log Analytics

---

# 📋 Activity Log

Registra todas as operações administrativas realizadas na assinatura Azure.

Exemplos:

- Criou VM
- Excluiu Storage
- Alterou NSG
- Criou Resource Group
- Alterou RBAC

### Gatilhos

- Quem criou?
- Quem alterou?
- Quem excluiu?
- Auditoria administrativa

➡️ Activity Log

---

# 📦 Resource Logs (Diagnostic Logs)

Registram eventos internos produzidos por um recurso específico.

Exemplos:

- Firewall bloqueou uma conexão.
- Key Vault recebeu tentativa de acesso.
- Storage recebeu requisição.
- Application Gateway registrou uma chamada.

### Gatilhos

- O que aconteceu dentro do recurso?
- Logs do Firewall
- Logs do Storage
- Logs do Key Vault

➡️ Resource Logs

---

# 📱 Application Insights

Especializado em monitorar aplicações.

Coleta automaticamente:

- Tempo de resposta
- Número de requisições
- Dependências
- Exceções
- Disponibilidade
- Performance

Ideal para:

- APIs
- Aplicações Web
- Microsserviços

### Gatilhos

- API lenta
- Erros da aplicação
- Exceções
- Telemetria
- Performance

➡️ Application Insights

---

# 🌍 Service Health

Mostra problemas da própria infraestrutura da Microsoft.

As notificações são divididas em três categorias:

- **Service Issues** → Falhas ou indisponibilidades.
- **Planned Maintenance** → Manutenções programadas.
- **Health Advisories** → Avisos importantes (mudanças, aposentadoria de serviços, etc.).

### Gatilhos

- A Azure caiu.
- Problema em uma região.
- Manutenção programada.
- Incidente da Microsoft.

➡️ Service Health

---

# 💡 Azure Advisor

Analisa seus recursos e gera recomendações em cinco categorias:

- 💲 Custo
- 🔒 Segurança
- ⚡ Desempenho
- ❤️ Confiabilidade
- ⚙️ Excelência Operacional

### Como diferenciar

**Custo**
- Recursos subutilizados
- Redimensionamento
- Economia

**Segurança**
- Secure Score
- Recomendações do Defender

**Confiabilidade**
- Alta disponibilidade
- Backup
- Redundância

**Desempenho**
- Gargalos
- Latência
- Performance

**Excelência Operacional**
- Boas práticas
- Governança
- Automação
- Configuração

### Gatilhos

- Melhorar ambiente
- Recomendações
- Boas práticas
- Otimização

➡️ Azure Advisor

---

# 🎯 Como decorar

📊 **Azure Monitor** → Monitora tudo.

🔍 **Log Analytics** → Consulta os logs (KQL).

👤 **Activity Log** → Quem fez o quê.

📦 **Resource Logs** → O que aconteceu dentro do recurso.

📱 **Application Insights** → Saúde da aplicação.

🌍 **Service Health** → Saúde da plataforma Azure.

💡 **Advisor** → Recomenda melhorias.

---

# 📝 Comparações

| Comparação | Diferença |
|------------|-----------|
| Azure Monitor × Log Analytics | Monitor coleta dados; Log Analytics consulta os logs. |
| Activity Log × Resource Logs | Activity Log registra ações administrativas; Resource Logs registram eventos do recurso. |
| Azure Monitor × Application Insights | Azure Monitor monitora qualquer recurso; Application Insights monitora aplicações. |
| Service Health × Azure Monitor | Service Health monitora a plataforma Azure; Azure Monitor monitora seus recursos. |
| Azure Monitor Alerts × Application Insights | Alerts notificam automaticamente; Application Insights coleta telemetria da aplicação. |

---

# 💡 Macete da prova

- **Quem fez?** → **Activity Log**
- **O que aconteceu no recurso?** → **Resource Logs**
- **Consultar logs?** → **Log Analytics**
- **KQL?** → **Log Analytics**
- **Aplicação lenta?** → **Application Insights**
- **CPU, memória e alertas?** → **Azure Monitor**
- **Problema na Azure?** → **Service Health**
- **Melhorar o ambiente?** → **Advisor**
