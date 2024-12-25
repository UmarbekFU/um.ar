document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notesList');
    const noteEditor = new Quill('#noteEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Load notes
    async function loadNotes() {
        try {
            const response = await fetch('/api/notes');
            const notes = await response.json();
            notesList.innerHTML = notes.map(note => `
                <div class="note-item" data-id="${note.id}">
                    <h3>${note.title}</h3>
                    <p>${note.content.substring(0, 100)}...</p>
                </div>
            `).join('');

            // Add click handlers
            document.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => loadNote(item.dataset.id));
            });
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    // Load single note
    async function loadNote(id) {
        try {
            const response = await fetch(`/api/notes/${id}`);
            const note = await response.json();
            document.getElementById('noteTitle').value = note.title;
            noteEditor.setContents(note.content);
        } catch (error) {
            console.error('Error loading note:', error);
        }
    }

    // Save note
    document.getElementById('saveNoteBtn').addEventListener('click', async () => {
        const title = document.getElementById('noteTitle').value;
        const content = noteEditor.getContents();

        try {
            const response = await fetch('/api/notes/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content })
            });

            if (response.ok) {
                loadNotes(); // Refresh list
            } else {
                throw new Error('Failed to save note');
            }
        } catch (error) {
            console.error('Error saving note:', error);
        }
    });

    // Initial load
    loadNotes();
}); 