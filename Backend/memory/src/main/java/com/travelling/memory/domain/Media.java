package com.travelling.memory.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "memory_id", nullable = false)
    private Memory memory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32, name = "media_type")
    private MediaType mediaType;

    @Column(nullable = false, length = 512, name = "storage_key")
    private String storageKey;

    @Column(length = 512, name = "thumbnail_key")
    private String thumbnailKey;

    @Column(nullable = false, name = "file_size")
    private Long fileSize;

    private Integer width;

    private Integer height;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "order_index")
    @Builder.Default
    private Integer orderIndex = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

