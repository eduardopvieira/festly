package com.projeto.festly.service;

import com.projeto.festly.dto.AgendamentoRequest;
import com.projeto.festly.dto.AgendamentoResponse;
import com.projeto.festly.entity.Agendamento;
import com.projeto.festly.entity.Servico;
import com.projeto.festly.entity.StatusAgendamento;
import com.projeto.festly.entity.Usuario;
import com.projeto.festly.repository.AgendamentoRepository;
import com.projeto.festly.repository.ServicoRepository;
import com.projeto.festly.repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AgendamentoService {

    private final AgendamentoRepository repository;
    private final ServicoRepository servicoRepository;
    private final UsuarioRepository usuarioRepository;

    public AgendamentoResponse agendar(AgendamentoRequest request) {
        // 1. Verifica se a data já está ocupada
        boolean dataOcupada = repository.existsByServicoIdAndDataEventoAndStatusNot(
                request.getServicoId(),
                request.getDataEvento(),
                StatusAgendamento.CANCELADO // Ignora os cancelados, pois a data volta a ficar livre
        );

        if (dataOcupada) {
            throw new IllegalStateException("O serviço já está reservado para esta data.");
        }

        // 2. Busca o serviço e o cliente (lança exceção se não achar)
        // Busca o serviço e lança erro se não existir
        Servico servico = servicoRepository.findById(request.getServicoId())
                .orElseThrow(() -> new EntityNotFoundException("Serviço com ID " + request.getServicoId() + " não encontrado."));

        // Busca o cliente e lança erro se não existir
        Usuario cliente = usuarioRepository.findById(request.getClienteId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário cliente com ID " + request.getClienteId() + " não encontrado."));

        // 3. Cria e salva o agendamento
        Agendamento agendamento = Agendamento.builder()
                .servico(servico)
                .cliente(cliente)
                .dataEvento(request.getDataEvento())
                .status(StatusAgendamento.PENDENTE) // Começa como pendente até aprovação/pagamento
                .build();

        return AgendamentoResponse.from(repository.save(agendamento));
    }

    public List<String> buscarDatasOcupadas(Long servicoId) {
        // Verifica primeiro se o serviço existe, mantendo o padrão do seu ServicoService
        if (!servicoRepository.existsById(servicoId)) {
            throw new EntityNotFoundException("Serviço não encontrado: " + servicoId);
        }

        // Busca as datas e converte para String (formato ISO)
        return repository.findDatasOcupadasByServicoId(servicoId)
                .stream()
                .map(date -> date.toString())
                .collect(Collectors.toList());
    }
}