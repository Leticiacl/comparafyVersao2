import React from "react";

const UPDATED_AT = new Date().toLocaleDateString("pt-BR");

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="text-base font-semibold text-gray-900">{title}</h2>
    <div className="space-y-2 text-gray-700">{children}</div>
  </section>
);

const TermsBody: React.FC = () => {
  return (
    <article className="space-y-5">
      <p className="text-sm text-gray-500">Última atualização: {UPDATED_AT}</p>

      <Section title="1. Introdução">
        <p>
          Bem-vindo ao <strong>Comparafy</strong>. Estes Termos de Uso regem o acesso e a utilização do aplicativo e
          serviços relacionados. Ao usar o Comparafy, você concorda integralmente com estes termos.
        </p>
      </Section>

      <Section title="2. Elegibilidade e Conta">
        <ul className="list-disc pl-5 space-y-1">
          <li>Você deve ter capacidade legal para contratar segundo a legislação brasileira.</li>
          <li>
            Ao criar uma conta, mantenha suas informações corretas e atualizadas. Você é responsável por todas as
            atividades realizadas na sua conta.
          </li>
        </ul>
      </Section>

      <Section title="3. Privacidade e Dados">
        <p>
          Valorizamos sua privacidade. Utilizamos dados para operar funcionalidades como listas, histórico e
          comparações de preços. Dados pessoais são tratados conforme a LGPD (Lei nº 13.709/2018).
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Você pode excluir sua conta e dados a qualquer momento nas configurações ou por solicitação no app.</li>
          <li>Podemos coletar metadados de uso para melhoria do serviço.</li>
        </ul>
      </Section>

      <Section title="4. Funcionalidades e Limitações">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            O Comparafy auxilia na <strong>organização de listas</strong>, <strong>registro de compras</strong> e{" "}
            <strong>comparação de preços</strong> entre mercados.
          </li>
          <li>
            Preços exibidos podem ser estimativas informadas por usuários ou extraídas de cupons/nota fiscal
            eletrônica; variações podem ocorrer por data, região, promoções e disponibilidade.
          </li>
          <li>
            A leitura de NFC-e/QR Code depende de disponibilidade do serviço das Secretarias de Fazenda (SEFAZ) e das
            informações publicadas. Interrupções externas podem afetar a funcionalidade.
          </li>
        </ul>
      </Section>

      <Section title="5. Conteúdo do Usuário">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Você é responsável pelos dados que insere (nomes, preços, estabelecimentos). Não publique informações
            falsas ou que violem direitos de terceiros.
          </li>
          <li>
            Podemos remover conteúdo que viole estes termos ou a legislação vigente, sem prejuízo de outras medidas.
          </li>
        </ul>
      </Section>

      <Section title="6. Usos Proibidos">
        <ul className="list-disc pl-5 space-y-1">
          <li>Engenharia reversa, scraping automatizado e uso para fins ilícitos.</li>
          <li>Interferir na segurança, estabilidade ou disponibilidade do serviço.</li>
          <li>Compartilhar credenciais de acesso ou burlar mecanismos de autenticação.</li>
        </ul>
      </Section>

      <Section title="7. Responsabilidade e Garantias">
        <ul className="list-disc pl-5 space-y-1">
          <li>
            O Comparafy é fornecido “como está”, sem garantias de disponibilidade, precisão ou adequação a um
            propósito específico.
          </li>
          <li>
            Não nos responsabilizamos por perdas decorrentes de decisões de compra, diferenças de preços ou falhas de
            serviços de terceiros (SEFAZ, redes de mercado, provedores etc.).
          </li>
        </ul>
      </Section>

      <Section title="8. Planos, Pagamentos e Tributos (se aplicável)">
        <p>
          Recursos pagos, quando houver, serão apresentados com preço, periodicidade e condições. Impostos e taxas
          podem ser incluídos conforme legislação aplicável.
        </p>
      </Section>

      <Section title="9. Alterações nos Termos">
        <p>
          Podemos atualizar estes Termos para refletir melhorias, requisitos legais ou ajustes de produto. Alterações
          relevantes serão comunicadas no app. O uso contínuo após a atualização implica concordância.
        </p>
      </Section>

      <Section title="10. Encerramento">
        <p>
          Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar o acesso em caso de violação
          destes Termos ou uso indevido.
        </p>
      </Section>

      <Section title="11. Lei Aplicável e Foro">
        <p>
          Estes Termos são regidos pelas leis do Brasil. Fica eleito o foro de seu domicílio para dirimir questões
          oriundas deste documento, salvo regras de competência legais.
        </p>
      </Section>

      <Section title="12. Contato">
        <p>
          Suporte e solicitações devem ser feitos diretamente pelo aplicativo:{" "}
          <strong>Instagram → @comparafy</strong>.
        </p>
      </Section>
    </article>
  );
};

export default TermsBody;
