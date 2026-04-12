import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'author',
  title: 'Penulis (Author)',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nama Lengkap',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'role',
      title: 'Jabatan / Peran',
      type: 'string',
      description: 'Contoh: Ketua Divisi Pendidikan, Pemuda Pengajar 2024',
    }),
    defineField({
      name: 'image',
      title: 'Pas Foto',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    defineField({
      name: 'bio',
      title: 'Biografi Singkat',
      type: 'array',
      of: [
        {
          title: 'Block',
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
        },
      ],
    }),
    defineField({
      name: 'quote',
      title: 'Pesan/Quote Unggulan',
      type: 'text',
      rows: 3,
      description: 'Pesan atau kutipan motivasi yang akan ditampilkan besar di profil',
    }),
    defineField({
      name: 'expertise',
      title: 'Keahlian (Expertise / Tags)',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      },
      description: 'Ketik lalu tekan Enter untuk menambahkan tag keahlian',
    }),
    defineField({
      name: 'socialMedia',

      title: 'Media Sosial',
      type: 'object',
      description: 'Isi link media sosial yang ingin ditampilkan di profil',
      fields: [
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
          description: 'Contoh: https://instagram.com/namakamu',
        },
        {
          name: 'twitter',
          title: 'Twitter / X',
          type: 'url',
          description: 'Contoh: https://twitter.com/namakamu',
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url',
          description: 'Contoh: https://linkedin.com/in/namakamu',
        },
        {
          name: 'youtube',
          title: 'YouTube',
          type: 'url',
          description: 'Contoh: https://youtube.com/@namakamu',
        },
        {
          name: 'website',
          title: 'Website Pribadi',
          type: 'url',
          description: 'Contoh: https://namakamu.dev',
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'image',
    },
  },
})
