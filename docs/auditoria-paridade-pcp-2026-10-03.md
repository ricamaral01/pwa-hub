# Auditoria de paridade da API PCP — 03/10/2026

Somente `GET` foi enviado ao oficial e à cópia. Os tokens foram criados em memória de contas ADMIN existentes e não foram registrados. Respostas JSON foram serializadas com chaves ordenadas, sem espaços e em UTF-8 antes do SHA-256. Estas consultas não acionam importação do Google Sheets.

`Comparação` usa `GET /api/dashboard`; não há endpoint distinto. Período de outubro: 01–03/10, sem dias futuros.

**Resultado:** 63/63 respostas iguais; 0 divergências. Cada resposta retornou HTTP 200 nos dois ambientes.

| Período | Endpoint/tela | HTTP oficial/cópia | SHA-256 oficial | SHA-256 cópia | Diferença |
|---|---|---|---|---|---|
| 2026-07-31 | Produção | 200/200 | `80d9196ae30be976aeaca09b57e4f1f8a7a7bdf9798c6868d50a170d799ec918` | `80d9196ae30be976aeaca09b57e4f1f8a7a7bdf9798c6868d50a170d799ec918` | igual |
| 2026-07-31 | Dashboard / Comparação | 200/200 | `f6f4da0eb2f3d99b0555f66c71b03394b5aecc0979eb3a0059e2181c7e6098f4` | `f6f4da0eb2f3d99b0555f66c71b03394b5aecc0979eb3a0059e2181c7e6098f4` | igual |
| 2026-07-31 | PCP Diário (5 dias) | 200/200 | `830f76f32682bd076f25586342d91a173a78f9bde7e42f47ff4d8a15dc1c5be7` | `830f76f32682bd076f25586342d91a173a78f9bde7e42f47ff4d8a15dc1c5be7` | igual |
| 2026-07-31 | Apontamento Mega | 200/200 | `7ae0b86c91321f6a883fceb3152bf7a32f8e363bfcb597619ea7850373b2419b` | `7ae0b86c91321f6a883fceb3152bf7a32f8e363bfcb597619ea7850373b2419b` | igual |
| 2026-08-01 | Produção | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-08-01 | Dashboard / Comparação | 200/200 | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | igual |
| 2026-08-01 | PCP Diário (5 dias) | 200/200 | `bee26591ff37463299549624b2ec61bea7c9e6a511753a532ed8dc5b3e0b6df8` | `bee26591ff37463299549624b2ec61bea7c9e6a511753a532ed8dc5b3e0b6df8` | igual |
| 2026-08-01 | Apontamento Mega | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-08-03 | Produção | 200/200 | `44d8d1b424bb04f6144a424faf31789b9577041c90fba9b88adb29815a87619d` | `44d8d1b424bb04f6144a424faf31789b9577041c90fba9b88adb29815a87619d` | igual |
| 2026-08-03 | Dashboard / Comparação | 200/200 | `72b9981e64f7ced9c3e25d5236186e7774e3c9a80910e008b5b5fd39e6e59cff` | `72b9981e64f7ced9c3e25d5236186e7774e3c9a80910e008b5b5fd39e6e59cff` | igual |
| 2026-08-03 | PCP Diário (5 dias) | 200/200 | `1adb3b8de1654665d04dda67fc31cce8aef3280b108a0b926dae89e1c8f85568` | `1adb3b8de1654665d04dda67fc31cce8aef3280b108a0b926dae89e1c8f85568` | igual |
| 2026-08-03 | Apontamento Mega | 200/200 | `14298a0a0376070605adfb8403d6cd8952cd8f4606253faf0eaee4440e9ef74f` | `14298a0a0376070605adfb8403d6cd8952cd8f4606253faf0eaee4440e9ef74f` | igual |
| 2026-08-31 | Produção | 200/200 | `506223635b85314293abd1b72c2b14903a1f38df98cd7e754ced12aefbf928aa` | `506223635b85314293abd1b72c2b14903a1f38df98cd7e754ced12aefbf928aa` | igual |
| 2026-08-31 | Dashboard / Comparação | 200/200 | `ceaf4b7acd93b51b8ad5e424bf451583b704aef6074ac005229798caf2edf419` | `ceaf4b7acd93b51b8ad5e424bf451583b704aef6074ac005229798caf2edf419` | igual |
| 2026-08-31 | PCP Diário (5 dias) | 200/200 | `0c5ef9d69becda503434e36e6688f73de24287f86825c985150de6c18943cc2b` | `0c5ef9d69becda503434e36e6688f73de24287f86825c985150de6c18943cc2b` | igual |
| 2026-08-31 | Apontamento Mega | 200/200 | `3405067d21e5dd7c2f92b4efef3bfc67e25d10e0e17eb9600a1107fa48f3571d` | `3405067d21e5dd7c2f92b4efef3bfc67e25d10e0e17eb9600a1107fa48f3571d` | igual |
| 2026-09-01 | Produção | 200/200 | `4932bbec5480c7776d9beb96a062c756c298ed2a3405dfc596f238392ca7a95b` | `4932bbec5480c7776d9beb96a062c756c298ed2a3405dfc596f238392ca7a95b` | igual |
| 2026-09-01 | Dashboard / Comparação | 200/200 | `beab21c20ef7a755c9bb4cce34e988ee02c4ce35e9a6c0dfbfaf181295c52338` | `beab21c20ef7a755c9bb4cce34e988ee02c4ce35e9a6c0dfbfaf181295c52338` | igual |
| 2026-09-01 | PCP Diário (5 dias) | 200/200 | `5dbb574622284a565ba0fa3f58cf44fe6b976abac57c18f2882be75c38c2af5a` | `5dbb574622284a565ba0fa3f58cf44fe6b976abac57c18f2882be75c38c2af5a` | igual |
| 2026-09-01 | Apontamento Mega | 200/200 | `ddc57e7feb5c34811bcb209e283873ad8aa62914187f28d474e9cb25af229dbb` | `ddc57e7feb5c34811bcb209e283873ad8aa62914187f28d474e9cb25af229dbb` | igual |
| 2026-09-07 | Produção | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-09-07 | Dashboard / Comparação | 200/200 | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | igual |
| 2026-09-07 | PCP Diário (5 dias) | 200/200 | `933480224ea08535db41e8638a266fffd74c321b02e4289f74f401703c0d3d0b` | `933480224ea08535db41e8638a266fffd74c321b02e4289f74f401703c0d3d0b` | igual |
| 2026-09-07 | Apontamento Mega | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-09-13 | Produção | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-09-13 | Dashboard / Comparação | 200/200 | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | igual |
| 2026-09-13 | PCP Diário (5 dias) | 200/200 | `e61e5fee033cde360ba5147cea1f16c5cc6abf99b171a3d2bf1cc84e84ebbeb4` | `e61e5fee033cde360ba5147cea1f16c5cc6abf99b171a3d2bf1cc84e84ebbeb4` | igual |
| 2026-09-13 | Apontamento Mega | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-09-14 | Produção | 200/200 | `273c6a1fb56182b645a4ad24af97fa0bf570bd89abb45e0077ed6a146a58b7ec` | `273c6a1fb56182b645a4ad24af97fa0bf570bd89abb45e0077ed6a146a58b7ec` | igual |
| 2026-09-14 | Dashboard / Comparação | 200/200 | `2fe0210e5be1385da7c12d31e43423634834d9dec0176c5acbe11e178642d958` | `2fe0210e5be1385da7c12d31e43423634834d9dec0176c5acbe11e178642d958` | igual |
| 2026-09-14 | PCP Diário (5 dias) | 200/200 | `5c87316a47c4a504a9ceed01ecb4c4a59f00aac2b1370e7e55bec2d13aef1384` | `5c87316a47c4a504a9ceed01ecb4c4a59f00aac2b1370e7e55bec2d13aef1384` | igual |
| 2026-09-14 | Apontamento Mega | 200/200 | `c7b1e53a29b66e70dc4a4f451ed4a1dab4c35b9f9a2709ddb36616fa1d5321a7` | `c7b1e53a29b66e70dc4a4f451ed4a1dab4c35b9f9a2709ddb36616fa1d5321a7` | igual |
| 2026-09-30 | Produção | 200/200 | `83e0af0e0b95c9e6c9863f1d575c35c59babb4d2849c0976d0cf054960f307ac` | `83e0af0e0b95c9e6c9863f1d575c35c59babb4d2849c0976d0cf054960f307ac` | igual |
| 2026-09-30 | Dashboard / Comparação | 200/200 | `a7526c7dae0c3bf5af5a7f332327151d2bddf01a3d18221bb4862772c641c63d` | `a7526c7dae0c3bf5af5a7f332327151d2bddf01a3d18221bb4862772c641c63d` | igual |
| 2026-09-30 | PCP Diário (5 dias) | 200/200 | `54293ab8fd530480821b1d73f8090a5cf2897ba8af71cadf9f896ff2bfb1ac07` | `54293ab8fd530480821b1d73f8090a5cf2897ba8af71cadf9f896ff2bfb1ac07` | igual |
| 2026-09-30 | Apontamento Mega | 200/200 | `17b7b4edb934edf2863b1e65da9844b5b88aa13c75b17913e7201678e79bba1f` | `17b7b4edb934edf2863b1e65da9844b5b88aa13c75b17913e7201678e79bba1f` | igual |
| 2026-10-01 | Produção | 200/200 | `fd2fd00035f0b18f38d7a52665bf5fa0190d5c71d9833bc1f768a8174fa4b475` | `fd2fd00035f0b18f38d7a52665bf5fa0190d5c71d9833bc1f768a8174fa4b475` | igual |
| 2026-10-01 | Dashboard / Comparação | 200/200 | `8321eccd37a33f777775348c6e2751dd81940d7fca81de655f98a592959d88c5` | `8321eccd37a33f777775348c6e2751dd81940d7fca81de655f98a592959d88c5` | igual |
| 2026-10-01 | PCP Diário (5 dias) | 200/200 | `98bdbbab5b94ebffdc48dedef216fe1158b816840cc2254c2d19031316019718` | `98bdbbab5b94ebffdc48dedef216fe1158b816840cc2254c2d19031316019718` | igual |
| 2026-10-01 | Apontamento Mega | 200/200 | `1ef7710f4dc1dc57b8ba97bf475b726f3e6185bf5c9c681d3eebb49c4f7c6ad3` | `1ef7710f4dc1dc57b8ba97bf475b726f3e6185bf5c9c681d3eebb49c4f7c6ad3` | igual |
| 2026-10-02 | Produção | 200/200 | `62f05e1422dfaceb3f90c47bb9c7b7b982bc92133df14e62520c86f94a726108` | `62f05e1422dfaceb3f90c47bb9c7b7b982bc92133df14e62520c86f94a726108` | igual |
| 2026-10-02 | Dashboard / Comparação | 200/200 | `0daa58b095733cf110779a4dc9bee387a41de7d6c37921856d3e0147d5dc4e52` | `0daa58b095733cf110779a4dc9bee387a41de7d6c37921856d3e0147d5dc4e52` | igual |
| 2026-10-02 | PCP Diário (5 dias) | 200/200 | `413e8e8d2badb2b903f70001cc52a887d44f43813ba3205eb2b38a87ab0fb951` | `413e8e8d2badb2b903f70001cc52a887d44f43813ba3205eb2b38a87ab0fb951` | igual |
| 2026-10-02 | Apontamento Mega | 200/200 | `29af26ad0dad0c6c5804f84a6e0ff9fbe9144e2caf34fc8e268b4e67a66ed919` | `29af26ad0dad0c6c5804f84a6e0ff9fbe9144e2caf34fc8e268b4e67a66ed919` | igual |
| 2026-10-03 | Produção | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-10-03 | Dashboard / Comparação | 200/200 | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | `d70aafd519854f6d06b0d4292befbe32aae365f8fd63c7fd33bea15de7d778c5` | igual |
| 2026-10-03 | PCP Diário (5 dias) | 200/200 | `4b6c43984b4b3b8fe1b9c955b7c1eb9c410e0a7c224dfc2bb3d4ed18669c8290` | `4b6c43984b4b3b8fe1b9c955b7c1eb9c410e0a7c224dfc2bb3d4ed18669c8290` | igual |
| 2026-10-03 | Apontamento Mega | 200/200 | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | `4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945` | igual |
| 2026-08 | Acompanhamento S1/2 | 200/200 | `b6494e2b4ff5a1d955400fcc7e23a5b763834b93509ad078ace9fb4b532f455a` | `b6494e2b4ff5a1d955400fcc7e23a5b763834b93509ad078ace9fb4b532f455a` | igual |
| 2026-08 | Acompanhamento S3/4 | 200/200 | `11a98af5ba31183bff78dcb425ba9489206630c1ab7503b33257aa93f3312ea4` | `11a98af5ba31183bff78dcb425ba9489206630c1ab7503b33257aa93f3312ea4` | igual |
| 2026-08 | PCP Diário mensal | 200/200 | `ca191382f171f955b5203361a264e81c679c4e484cae3f03a6c074733eb9ff14` | `ca191382f171f955b5203361a264e81c679c4e484cae3f03a6c074733eb9ff14` | igual |
| 2026-08 | Dashboard / Comparação | 200/200 | `db660f804c62392e4ae65925a1a4616162ec00496028f3a52dacd235e76dc93e` | `db660f804c62392e4ae65925a1a4616162ec00496028f3a52dacd235e76dc93e` | igual |
| 2026-08 | Volume total | 200/200 | `931fc98cb07baacd6bc71143e36de22fdc65f8bcf7cf59c6b3d878bfdbac4a2d` | `931fc98cb07baacd6bc71143e36de22fdc65f8bcf7cf59c6b3d878bfdbac4a2d` | igual |
| 2026-09 | Acompanhamento S1/2 | 200/200 | `f89a9e2507152810c788a5afbea18ada681411545ddd637a34dcc951d40c72ff` | `f89a9e2507152810c788a5afbea18ada681411545ddd637a34dcc951d40c72ff` | igual |
| 2026-09 | Acompanhamento S3/4 | 200/200 | `a20733a435bf7b1e3cbf7b0dd00a46494bb4977417b20e1b12832546edb15188` | `a20733a435bf7b1e3cbf7b0dd00a46494bb4977417b20e1b12832546edb15188` | igual |
| 2026-09 | PCP Diário mensal | 200/200 | `9714200ad17ebdb2088637a3952b35d37089b4d823a9b78795f30d3dd054e753` | `9714200ad17ebdb2088637a3952b35d37089b4d823a9b78795f30d3dd054e753` | igual |
| 2026-09 | Dashboard / Comparação | 200/200 | `8b2e8cc3920e5eeeaeb94fb591d28c15c424154bb6f6afe2f8ec93192720ffa2` | `8b2e8cc3920e5eeeaeb94fb591d28c15c424154bb6f6afe2f8ec93192720ffa2` | igual |
| 2026-09 | Volume total | 200/200 | `d50ce139fcc96f4c866518f38a81930cd576c2d650f7009e23a154c302b5900d` | `d50ce139fcc96f4c866518f38a81930cd576c2d650f7009e23a154c302b5900d` | igual |
| 2026-10 | Acompanhamento S1/2 | 200/200 | `9b9e833466eeb6bcae9861051fefc215dc02e83af832d0f4dcfe28b4d26bceab` | `9b9e833466eeb6bcae9861051fefc215dc02e83af832d0f4dcfe28b4d26bceab` | igual |
| 2026-10 | Acompanhamento S3/4 | 200/200 | `a5f9d3c4a0a9eaebbf403ece410088c12c3a2a0d7a64d23a80eaec652ddf871a` | `a5f9d3c4a0a9eaebbf403ece410088c12c3a2a0d7a64d23a80eaec652ddf871a` | igual |
| 2026-10 | PCP Diário mensal | 200/200 | `924df86af07ba31af53c3843b36ba54f548f5bf37659083a77e8da08420593ac` | `924df86af07ba31af53c3843b36ba54f548f5bf37659083a77e8da08420593ac` | igual |
| 2026-10 | Dashboard / Comparação | 200/200 | `092fec6874159ae26a704dea7eba4a492ce8890fd93670b90223df54665b3796` | `092fec6874159ae26a704dea7eba4a492ce8890fd93670b90223df54665b3796` | igual |
| 2026-10 | Volume total | 200/200 | `52969b3f6d5a80be88632fc893f4a1ebfd7a0379fe79addef3d7de66919b3952` | `52969b3f6d5a80be88632fc893f4a1ebfd7a0379fe79addef3d7de66919b3952` | igual |

A divergência anterior de 0,01 m³ em `volume_programado` era causada pela diferença entre Python 3.10 (oficial) e 3.12 (cópia) na soma de floats. A cópia agora usa Python 3.10.22; os 47 arquivos do backend permanecem idênticos e nenhuma consulta ou regra foi alterada.
