import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Artikel & Jurnal (Post)',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Judul Artikel',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'author',
      title: 'Penulis',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'mainImage',
      title: 'Gambar Sampul (Cover)',
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
      name: 'categories',
      title: 'Kategori',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'excerpt',
      title: 'Kutipan Singkat (Excerpt)',
      type: 'text',
      description: 'Cuplikan pendek yang muncul di halaman daftar artikel.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Tanggal Rilis',
      type: 'datetime',
    }),
    defineField({
      name: 'body',
      title: 'Isi Konten Artikel',
      type: 'blockContent',
    }),
  ],

  preview: {
    select: {
      title: 'title',
      author: 'author.name',
      media: 'mainImage',
    },
    prepare(selection) {
      const { author } = selection
      return { ...selection, subtitle: author && `by ${author}` }
    },
  },
})
