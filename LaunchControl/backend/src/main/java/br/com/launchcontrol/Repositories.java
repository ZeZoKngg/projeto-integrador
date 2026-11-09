
package br.com.launchcontrol;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

// Repositório responsável pelas operações no banco de dados relacionadas aos usuários.
// O JpaRepository já fornece métodos como save(), findById(), findAll() e deleteById().
interface UsuarioRepo extends JpaRepository<Usuario, Long> {

    // Procura um usuário pelo e-mail, utilizado principalmente na autenticação.
    // O Optional permite tratar situações em que o e-mail não está cadastrado.
    Optional<Usuario> findByEmail(String email);
}

// Responsável pelo acesso aos veículos cadastrados no sistema.
interface VeiculoRepo extends JpaRepository<Veiculo, Long> {

    // Retorna todos os veículos vinculados ao ID de um cliente.
    // O resultado é uma lista, pois um cliente pode possuir vários veículos.
    List<Veiculo> findByClienteId(Long id);

    // Verifica se já existe um veículo com a placa informada.
    // Retorna true quando encontra a placa e false quando não encontra.
    boolean existsByPlaca(String placa);
}

// Gerencia as consultas das solicitações de serviços realizadas no LaunchControl.
interface SolicitacaoRepo extends JpaRepository<Solicitacao, Long> {

    // Busca as solicitações de um cliente pelo seu ID.
    // Organiza os resultados da mais recente para a mais antiga.
    List<Solicitacao> findByClienteIdOrderByCriadaEmDesc(Long id);

    // Busca as solicitações vinculadas a uma oficina.
    // Também ordena pela data de criação, começando pelas mais recentes.
    List<Solicitacao> findByOficinaIdOrderByCriadaEmDesc(Long id);
}

// Responsável pelas consultas e operações relacionadas aos orçamentos.
interface OrcamentoRepo extends JpaRepository<Orcamento, Long> {

    // Procura o orçamento vinculado a uma solicitação específica.
    // Utiliza Optional porque a solicitação pode ainda não possuir orçamento.
    Optional<Orcamento> findBySolicitacaoId(Long id);
}

// Permite consultar e gerenciar as notificações dos usuários.
interface NotificacaoRepo extends JpaRepository<Notificacao, Long> {

    // Busca todas as notificações de um usuário pelo seu ID.
    // As notificações mais recentes aparecem primeiro.
    List<Notificacao> findByUsuarioIdOrderByCriadaEmDesc(Long id);
}

// Responsável pelo armazenamento e consulta das avaliações das oficinas.
interface AvaliacaoRepo extends JpaRepository<Avaliacao, Long> {

    // Procura a avaliação associada a uma solicitação.
    // Retorna Optional caso a avaliação ainda não tenha sido realizada.
    Optional<Avaliacao> findBySolicitacaoId(Long id);

    // Retorna as avaliações recebidas por uma oficina.
    // Pode ser utilizado para consultar o histórico de avaliações.
    List<Avaliacao> findByOficinaId(Long id);
}

// Gerencia as peças cadastradas pelos fornecedores.
interface PecaRepo extends JpaRepository<Peca, Long> {

    // Busca as peças pertencentes a um fornecedor específico.
    List<Peca> findByFornecedorId(Long id);

    // Retorna todas as peças cadastradas no sistema.
    // OrderByNomeAsc organiza os nomes em ordem alfabética crescente.
    List<Peca> findAllByOrderByNomeAsc();
}

// Responsável pelas cobranças relacionadas aos serviços.
interface CobrancaRepo extends JpaRepository<Cobranca, Long> {

    // Procura a cobrança de uma determinada solicitação.
    // O Optional permite verificar se a cobrança já foi criada.
    Optional<Cobranca> findBySolicitacaoId(Long id);
}

// Guarda e consulta os registros históricos dos orçamentos.
interface HistoricoOrcamentoRepo extends JpaRepository<HistoricoOrcamento, Long> {

    // Busca o histórico de alterações de um orçamento.
    // Ordena pela data de registro, mostrando primeiro as alterações mais recentes.
    List<HistoricoOrcamento> findByOrcamentoIdOrderByRegistradoEmDesc(Long id);
}

// Responsável pelas mensagens trocadas durante o atendimento.
interface MensagemAtendimentoRepo extends JpaRepository<MensagemAtendimento, Long> {

    // Busca todas as mensagens relacionadas a uma solicitação.
    // A ordenação crescente permite mostrar a conversa na sequência de envio.
    List<MensagemAtendimento> findBySolicitacaoIdOrderByEnviadaEmAsc(Long id);
}

// Gerencia os arquivos anexados aos atendimentos.
interface AnexoAtendimentoRepo extends JpaRepository<AnexoAtendimento, Long> {

    // Retorna os anexos de uma solicitação específica.
    // Organiza os arquivos dos mais recentes para os mais antigos.
    List<AnexoAtendimento> findBySolicitacaoIdOrderByCriadoEmDesc(Long id);
}

// Responsável pelo histórico de atualizações das manutenções.
interface DiarioManutencaoRepo extends JpaRepository<DiarioManutencao, Long> {

    // Busca as observações registradas durante a manutenção de um veículo.
    // Mostra primeiro as atualizações mais recentes do atendimento.
    List<DiarioManutencao> findBySolicitacaoIdOrderByCriadoEmDesc(Long id);
}

// Gerencia os tokens utilizados na recuperação de senha dos usuários.
interface TokenRecuperacaoSenhaRepo extends JpaRepository<TokenRecuperacaoSenha, Long> {

    // Procura um registro de recuperação pelo hash do token.
    // O Optional permite identificar quando o token não foi encontrado.
    Optional<TokenRecuperacaoSenha> findByTokenHash(String tokenHash);

    // Busca os tokens de recuperação de um usuário que ainda não foram utilizados.
    // O método filtra pelo ID do usuário e pelo campo utilizado igual a false.
    List<TokenRecuperacaoSenha> findByUsuarioIdAndUtilizadoFalse(Long usuarioId);
}
