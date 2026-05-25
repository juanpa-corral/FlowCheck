package com.flowcheck.controller;

import com.flowcheck.model.BudgetSemaphore;
import com.flowcheck.model.ISFBreakdown;
import com.flowcheck.model.Profile;
import com.flowcheck.service.ISFService;
import com.flowcheck.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller principal de la API REST de FlowCheck.
 *
 * Todos los endpoints (excepto /health) requieren autenticación
 * mediante el Bearer JWT emitido por Supabase.
 *
 * El JWT es validado por {@link com.flowcheck.security.JwtAuthFilter}
 * y el claim {@code sub} se expone como AuthenticationPrincipal (userId).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final ISFService     isfService;

    // ── Health check ─────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
                "status",  "ok",
                "service", "FlowCheck API",
                "version", "1.0.0"
        ));
    }

    // ── Perfil ────────────────────────────────────────────────────────────

    /**
     * Obtiene el perfil del usuario autenticado.
     * GET /api/profile
     */
    @GetMapping("/profile")
    public ResponseEntity<Profile> getProfile(@AuthenticationPrincipal String userId) {
        return profileService.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Actualiza el perfil del usuario autenticado.
     * PUT /api/profile
     *
     * Recibe un JSON parcial (solo los campos a modificar).
     * Recalcula el ISF automáticamente.
     */
    @PutMapping("/profile")
    public ResponseEntity<Profile> updateProfile(
            @AuthenticationPrincipal String userId,
            @RequestBody Profile patch) {
        try {
            Profile updated = profileService.update(userId, patch);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── ISF ───────────────────────────────────────────────────────────────

    /**
     * Calcula y retorna el Índice de Salud Financiera del usuario autenticado.
     * GET /api/isf
     */
    @GetMapping("/isf")
    public ResponseEntity<ISFBreakdown> getISF(@AuthenticationPrincipal String userId) {
        return profileService.findById(userId)
                .map(profile -> ResponseEntity.ok(isfService.calculate(profile)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Calcula y retorna el semáforo de presupuesto del usuario autenticado.
     * GET /api/semaphore
     */
    @GetMapping("/semaphore")
    public ResponseEntity<BudgetSemaphore> getSemaphore(@AuthenticationPrincipal String userId) {
        return profileService.findById(userId)
                .map(profile -> ResponseEntity.ok(isfService.calculateSemaphore(profile)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Dashboard summary ─────────────────────────────────────────────────

    /**
     * Retorna el resumen completo del dashboard.
     * GET /api/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(@AuthenticationPrincipal String userId) {
        return profileService.findById(userId).map(profile -> {
            ISFBreakdown    isf       = isfService.calculate(profile);
            BudgetSemaphore semaphore = isfService.calculateSemaphore(profile);

            return ResponseEntity.ok(Map.<String, Object>of(
                    "profile",   profile,
                    "isf",       isf,
                    "semaphore", semaphore
            ));
        }).orElse(ResponseEntity.notFound().build());
    }
}
