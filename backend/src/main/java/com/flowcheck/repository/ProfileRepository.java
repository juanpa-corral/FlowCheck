package com.flowcheck.repository;

import com.flowcheck.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repositorio JPA para la entidad Profile.
 * El ID es el UUID del usuario en Supabase Auth.
 */
@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
}
