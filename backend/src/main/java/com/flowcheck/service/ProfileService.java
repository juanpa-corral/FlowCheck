package com.flowcheck.service;

import com.flowcheck.model.Profile;
import com.flowcheck.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final ISFService isfService;

    /**
     * Obtiene el perfil de un usuario por su UUID (sub del JWT de Supabase).
     */
    public Optional<Profile> findById(String userId) {
        return profileRepository.findById(UUID.fromString(userId));
    }

    /**
     * Actualiza los campos del perfil y recalcula el ISF score.
     */
    @Transactional
    public Profile update(String userId, Profile patch) {
        Profile existing = profileRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new RuntimeException("Perfil no encontrado para el usuario: " + userId));

        // Aplicar solo los campos no nulos del patch
        if (patch.getFullName()          != null) existing.setFullName(patch.getFullName());
        if (patch.getUniversity()        != null) existing.setUniversity(patch.getUniversity());
        if (patch.getCareer()            != null) existing.setCareer(patch.getCareer());
        if (patch.getStratum()           != null) existing.setStratum(patch.getStratum());
        if (patch.getMonthlyIncome()     != null) existing.setMonthlyIncome(patch.getMonthlyIncome());
        if (patch.getIncomeSources()     != null) existing.setIncomeSources(patch.getIncomeSources());
        if (patch.getFixedExpenses()     != null) existing.setFixedExpenses(patch.getFixedExpenses());
        if (patch.getVariableExpenses()  != null) existing.setVariableExpenses(patch.getVariableExpenses());
        if (patch.getLeisureExpenses()   != null) existing.setLeisureExpenses(patch.getLeisureExpenses());
        if (patch.getTotalDebt()         != null) existing.setTotalDebt(patch.getTotalDebt());
        if (patch.getMonthlyDebtPayment()!= null) existing.setMonthlyDebtPayment(patch.getMonthlyDebtPayment());
        if (patch.getEmergencyFund()     != null) existing.setEmergencyFund(patch.getEmergencyFund());
        if (patch.getSavingsGoal()       != null) existing.setSavingsGoal(patch.getSavingsGoal());
        if (patch.getSavingsGoalMonths() != null) existing.setSavingsGoalMonths(patch.getSavingsGoalMonths());
        if (patch.getRiskProfile()       != null) existing.setRiskProfile(patch.getRiskProfile());
        if (patch.getOnboardingCompleted()!= null) existing.setOnboardingCompleted(patch.getOnboardingCompleted());

        // Recalcular ISF automáticamente
        double isfTotal = isfService.calculate(existing).getTotal();
        existing.setIsfScore(java.math.BigDecimal.valueOf(isfTotal));

        return profileRepository.save(existing);
    }
}
