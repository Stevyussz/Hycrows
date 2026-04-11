import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Kategori Artikel',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Judul Kategori',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Deskripsi Kategori',
      type: 'text',
    }),
  ],
})
