package com.taskflow.backend.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.taskflow.backend.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String name;
    private final String email;
    @JsonIgnore
    private final String password;
    private final String avatarUrl;
    private final String role;
    private final String bio;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(Long id, String name, String email, String password,
                         String avatarUrl, String role, String bio,
                         Collection<? extends GrantedAuthority> authorities) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.bio = bio;
        this.authorities = authorities;
    }

    public static UserPrincipal create(User user) {
        String roleStr = user.getRole() != null ? user.getRole() : "Member";
        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + roleStr.toUpperCase())
        );

        return new UserPrincipal(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getAvatarUrl(),
                user.getRole(),
                user.getBio(),
                authorities
        );
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getRole() { return role; }
    public String getBio() { return bio; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return email; }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
