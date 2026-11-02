package br.com.launchcontrol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
interface UsuarioRepo extends JpaRepository<Usuario,Long>{Optional<Usuario> findByEmail(String email);}
interface VeiculoRepo extends JpaRepository<Veiculo,Long>{List<Veiculo> findByClienteId(Long id); boolean existsByPlaca(String placa);}
interface SolicitacaoRepo extends JpaRepository<Solicitacao,Long>{List<Solicitacao> findByClienteIdOrderByCriadaEmDesc(Long id);List<Solicitacao> findByOficinaIdOrderByCriadaEmDesc(Long id);}
interface OrcamentoRepo extends JpaRepository<Orcamento,Long>{Optional<Orcamento> findBySolicitacaoId(Long id);}
interface NotificacaoRepo extends JpaRepository<Notificacao,Long>{List<Notificacao> findByUsuarioIdOrderByCriadaEmDesc(Long id);}
interface AvaliacaoRepo extends JpaRepository<Avaliacao,Long>{Optional<Avaliacao> findBySolicitacaoId(Long id);List<Avaliacao> findByOficinaId(Long id);}

interface PecaRepo extends JpaRepository<Peca,Long>{List<Peca> findByFornecedorId(Long id);List<Peca> findAllByOrderByNomeAsc();}

interface CobrancaRepo extends JpaRepository<Cobranca,Long>{Optional<Cobranca> findBySolicitacaoId(Long id);}
interface HistoricoOrcamentoRepo extends JpaRepository<HistoricoOrcamento,Long>{List<HistoricoOrcamento> findByOrcamentoIdOrderByRegistradoEmDesc(Long id);}

interface MensagemAtendimentoRepo extends JpaRepository<MensagemAtendimento,Long>{
 List<MensagemAtendimento> findBySolicitacaoIdOrderByEnviadaEmAsc(Long id);
}

interface AnexoAtendimentoRepo extends JpaRepository<AnexoAtendimento,Long>{List<AnexoAtendimento> findBySolicitacaoIdOrderByCriadoEmDesc(Long id);}
interface DiarioManutencaoRepo extends JpaRepository<DiarioManutencao,Long>{List<DiarioManutencao> findBySolicitacaoIdOrderByCriadoEmDesc(Long id);}


interface TokenRecuperacaoSenhaRepo extends JpaRepository<TokenRecuperacaoSenha, Long> {
    Optional<TokenRecuperacaoSenha> findByTokenHash(String tokenHash);
    List<TokenRecuperacaoSenha> findByUsuarioIdAndUtilizadoFalse(Long usuarioId);
}
