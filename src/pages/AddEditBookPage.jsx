import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { sanitizeHtml, isValidHttpUrl } from '../utils/sanitize';
import { GENRE_OPTIONS } from '../utils/constants';
import RichTextEditor from '../components/books/RichTextEditor';
import CoverUploadDropzone from '../components/books/CoverUploadDropzone';
import BookLivePreviewCard from '../components/books/BookLivePreviewCard';
import Breadcrumb from '../components/common/Breadcrumb';

const MAX_DESCRIPTION_CHARS = 5000;

export default function AddEditBookPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEdit = Boolean(id);
  const preselectedAuthorId = searchParams.get('author') || '';

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: preselectedAuthorId,
    publishedYear: new Date().getFullYear(),
    genre: 'Art & Architecture',
    price: '34.50',
    description: '',
    coverImage: '',
  });

  // Auxiliary State
  const [authors, setAuthors] = useState([]);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch Authors List for Dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadAuthors() {
      try {
        setLoadingAuthors(true);
        const res = await api.getAuthors({ page: 1, limit: 100 });
        if (isMounted) {
          const list = res?.data || [];
          setAuthors(list);
          if (!isEdit && !formData.author && list.length > 0 && !preselectedAuthorId) {
            setFormData(prev => ({ ...prev, author: list[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to load authors dropdown:', err);
      } finally {
        if (isMounted) setLoadingAuthors(false);
      }
    }
    loadAuthors();
    return () => { isMounted = false; };
  }, [isEdit, preselectedAuthorId]);

  // Reset Form State when switching to Add mode or when id changes
  useEffect(() => {
    if (!isEdit) {
      setFormData({
        title: '',
        author: preselectedAuthorId,
        publishedYear: new Date().getFullYear(),
        genre: 'Art & Architecture',
        price: '34.50',
        description: '',
        coverImage: '',
      });
      setFormErrors({});
      setInitialLoading(false);
    }
  }, [id, isEdit, preselectedAuthorId]);

  // Fetch Existing Book Data for Edit Mode
  useEffect(() => {
    if (!isEdit) return;
    let isMounted = true;

    async function loadBookData() {
      try {
        setInitialLoading(true);
        const res = await api.getBook(id);
        const book = res?.data;
        if (!book) throw new Error('Volume record could not be found');

        if (isMounted) {
          setFormData({
            title: book.title || '',
            author: book.author?._id || book.author || '',
            publishedYear: book.publishedYear || new Date().getFullYear(),
            genre: book.genre || 'General',
            price: book.price !== undefined && book.price !== null ? String(book.price) : '0',
            description: sanitizeHtml(book.description || ''),
            coverImage: book.coverImage || '',
          });
        }
      } catch (err) {
        console.error('Error fetching book for edit:', err);
        showToast(err.message || 'Failed to load volume metadata', 'error');
        navigate('/');
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    loadBookData();
    return () => { isMounted = false; };
  }, [id, isEdit, navigate, showToast]);

  // Calculate word count for Description (stripping HTML tags)
  const wordCount = useMemo(() => {
    if (!formData.description) return 0;
    const textContent = formData.description.replace(/<[^>]*>/g, ' ').trim();
    return textContent.split(/\s+/).filter(Boolean).length;
  }, [formData.description]);

  // Calculate sanitized HTML character count matching backend payload
  const charCount = useMemo(() => {
    if (!formData.description) return 0;
    return sanitizeHtml(formData.description.trim()).length;
  }, [formData.description]);

  // Selected Author Object for Live Preview
  const selectedAuthor = useMemo(() => {
    return authors.find(a => a._id === formData.author) || null;
  }, [authors, formData.author]);

  // Input Change Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Description Change Handler
  const handleDescriptionChange = (html) => {
    setFormData(prev => ({ ...prev, description: html }));
    if (formErrors.description) {
      setFormErrors(prev => ({ ...prev, description: '' }));
    }
  };

  // Cloudinary File Upload Handler
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, and WEBP image files are allowed', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File size exceeds the 5MB limit', 'error');
      return;
    }

    try {
      setUploadingCover(true);
      showToast('Uploading cover artwork to Cloudinary...', 'info', 2000);
      const res = await api.uploadCover(file);
      if (res?.url) {
        setFormData(prev => ({ ...prev, coverImage: res.url }));
        if (formErrors.coverImage) {
          setFormErrors(prev => ({ ...prev, coverImage: '' }));
        }
        showToast('Cover artwork uploaded successfully to Cloudinary!', 'success');
      } else {
        throw new Error(res?.message || 'Upload did not return an asset URL');
      }
    } catch (err) {
      console.error('Upload failed:', err);
      showToast(err.message || 'Failed to upload cover image', 'error');
    } finally {
      setUploadingCover(false);
    }
  }, [showToast, formErrors.coverImage]);

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Book title is required';
    } else if (formData.title.length > 120) {
      errors.title = 'Book title cannot exceed 120 characters';
    }

    if (!formData.author) {
      errors.author = 'Please select a primary author';
    }

    const currentYear = new Date().getFullYear();
    const yearNum = Number(formData.publishedYear);
    if (!yearNum || !Number.isInteger(yearNum) || yearNum <= 0) {
      errors.publishedYear = 'Please provide a valid past year';
    } else if (yearNum > currentYear) {
      errors.publishedYear = `Published year cannot be in the future (max ${currentYear})`;
    }

    const priceNum = Number(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Price must be a valid non-negative number';
    }

    if (formData.coverImage && formData.coverImage.trim()) {
      if (!isValidHttpUrl(formData.coverImage.trim())) {
        errors.coverImage = 'Cover image must be a valid HTTP or HTTPS URL';
      }
    }

    if (formData.description) {
      const sanitized = sanitizeHtml(formData.description.trim());
      if (sanitized.length > MAX_DESCRIPTION_CHARS) {
        errors.description = `Description content (including formatting tags) cannot exceed ${MAX_DESCRIPTION_CHARS} characters (currently ${sanitized.length}/${MAX_DESCRIPTION_CHARS})`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler (POST /books or PUT /books/:id)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Please address the highlighted form errors before proceeding', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        author: formData.author,
        publishedYear: Number(formData.publishedYear),
        genre: formData.genre.trim(),
        price: Number(formData.price),
        description: sanitizeHtml(formData.description.trim()),
        coverImage: formData.coverImage.trim() || '',
      };

      if (isEdit) {
        await api.updateBook(id, payload);
        showToast('Volume metadata successfully updated in archive!', 'success');
        navigate(`/books/${id}`);
      } else {
        const res = await api.createBook(payload);
        showToast('New volume successfully cataloged in archive!', 'success');
        const createdId = res?.data?._id;
        if (createdId) {
          navigate(`/books/${createdId}`);
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error('Failed to persist book:', err);
      showToast(err.message || 'Failed to save book record', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant font-sans">Loading volume metadata from archival database...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 sm:gap-8">
      {/* Page Title & Header Actions (Figma #1:926 - #1:931) */}
      <div className="flex flex-col">
        <Breadcrumb
          items={[
            { label: 'Books', to: '/' },
            { label: isEdit ? 'Edit Volume' : 'Add New Book' },
          ]}
          className="mb-1.5"
        />
        <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-primary font-normal tracking-tight break-words">
          {isEdit ? 'Edit Book Details' : 'Add New Book to Collection'}
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl font-sans">
          Enter bibliographic details, physical format specifics, and cataloging parameters.
        </p>
      </div>

      {/* Main Bento Grid: Form Fields (8 cols) + Physical Simulation (4 cols) (Figma #1:933) */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 sm:gap-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* LEFT 8 COLUMNS: FORM FIELDS (Figma #1:934) */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
            {/* Section 1: Basic Bibliographic Information (Figma #1:935 - #1:1009) */}
            <section className="bg-white p-5 sm:p-8 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-5 sm:gap-6">
              {/* Card Header: Title & "REQUIRED" Badge (Figma #1:936 - #1:947) */}
              <div className="flex items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-[#E9E8E6]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E9E8E6] flex items-center justify-center shrink-0">
                    <svg className="w-[19px] h-[14px] text-[#091426] fill-current" viewBox="0 0 19 14">
                      <path d="M11.2272 5.09541V3.62724C11.7022 3.42573 12.188 3.27459 12.6845 3.17384C13.1811 3.07308 13.7029 3.0227 14.2499 3.0227C14.6241 3.0227 14.9912 3.05149 15.351 3.10906C15.7108 3.16664 16.0635 3.23861 16.4089 3.32497V4.70678C16.0635 4.57723 15.7144 4.48007 15.3618 4.4153C15.0091 4.35053 14.6385 4.31814 14.2499 4.31814C13.7029 4.31814 13.1775 4.38651 12.6738 4.52326C12.17 4.66 11.6878 4.85071 11.2272 5.09541ZM11.2272 9.84537V8.3772C11.7022 8.17568 12.188 8.02455 12.6845 7.92379C13.1811 7.82304 13.7029 7.77266 14.2499 7.77266C14.6241 7.77266 14.9912 7.80145 15.351 7.85902C15.7108 7.9166 16.0635 7.98857 16.4089 8.07493V9.45673C16.0635 9.32719 15.7144 9.23003 15.3618 9.16526C15.0091 9.10049 14.6385 9.0681 14.2499 9.0681C13.7029 9.0681 13.1775 9.13287 12.6738 9.26242C12.17 9.39196 11.6878 9.58628 11.2272 9.84537ZM11.2272 7.47039V6.00222C11.7022 5.80071 12.188 5.64957 12.6845 5.54881C13.1811 5.44806 13.7029 5.39768 14.2499 5.39768C14.6241 5.39768 14.9912 5.42647 15.351 5.48404C15.7108 5.54162 16.0635 5.61359 16.4089 5.69995V7.08176C16.0635 6.95221 15.7144 6.85505 15.3618 6.79028C15.0091 6.72551 14.6385 6.69312 14.2499 6.69312C13.7029 6.69312 13.1775 6.76149 12.6738 6.89823C12.17 7.03498 11.6878 7.22569 11.2272 7.47039ZM4.74996 10.3635C5.42647 10.3635 6.08498 10.4391 6.72551 10.5902C7.36603 10.7414 8.00296 10.9681 8.63629 11.2704V2.76361C8.04614 2.41816 7.42001 2.15907 6.75789 1.98635C6.09578 1.81362 5.42647 1.72726 4.74996 1.72726C4.23178 1.72726 3.7172 1.77764 3.20622 1.87839C2.69524 1.97915 2.20225 2.13028 1.72726 2.3318V10.8817C2.23104 10.709 2.73123 10.5795 3.22781 10.4931C3.7244 10.4067 4.23178 10.3635 4.74996 10.3635ZM10.3635 11.2704C10.9969 10.9681 11.6338 10.7414 12.2743 10.5902C12.9148 10.4391 13.5734 10.3635 14.2499 10.3635C14.7681 10.3635 15.2754 10.4067 15.772 10.4931C16.2686 10.5795 16.7688 10.709 17.2726 10.8817V2.3318C16.7976 2.13028 16.3046 1.97915 15.7936 1.87839C15.2826 1.77764 14.7681 1.72726 14.2499 1.72726C13.5734 1.72726 12.9041 1.81362 12.2419 1.98635C11.5798 2.15907 10.9537 2.41816 10.3635 2.76361V11.2704ZM9.49992 13.8181C8.80901 13.2711 8.06053 12.8465 7.25448 12.5442C6.44843 12.2419 5.61359 12.0908 4.74996 12.0908C4.14542 12.0908 3.55167 12.17 2.96872 12.3283C2.38577 12.4866 1.82801 12.7097 1.29544 12.9976C0.993173 13.1559 0.701698 13.1487 0.421019 12.976C0.14034 12.8033 0 12.5514 0 12.2203V1.81362C0 1.65529 0.039583 1.50415 0.118749 1.36022C0.197915 1.21628 0.316664 1.10832 0.474996 1.03635C1.13711 0.690903 1.82801 0.431814 2.5477 0.259089C3.2674 0.0863629 4.00148 0 4.74996 0C5.5848 0 6.40165 0.107954 7.2005 0.323861C7.99936 0.539768 8.76583 0.863629 9.49992 1.29544C10.234 0.863629 11.0005 0.539768 11.7993 0.323861C12.5982 0.107954 13.415 0 14.2499 0C14.9984 0 15.7324 0.0863629 16.4521 0.259089C17.1718 0.431814 17.8627 0.690903 18.5248 1.03635C18.6832 1.10832 18.8019 1.21628 18.8811 1.36022C18.9602 1.50415 18.9998 1.65529 18.9998 1.81362V12.2203C18.9998 12.5514 18.8595 12.8033 18.5788 12.976C18.2981 13.1487 18.0067 13.1559 17.7044 12.9976C17.1718 12.7097 16.6141 12.4866 16.0311 12.3283C15.4482 12.17 14.8544 12.0908 14.2499 12.0908C13.3862 12.0908 12.5514 12.2419 11.7453 12.5442C10.9393 12.8465 10.1908 13.2711 9.49992 13.8181Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-sans font-semibold text-[16px] leading-[24px] tracking-[-0.005em] text-[#091426]">
                      Book Details
                    </h2>
                    <p className="font-sans text-[12px] leading-[18px] text-[#45474C]">
                      Core title, authorship, categorization, and pricing.
                    </p>
                  </div>
                </div>
                <span className="px-[10px] py-[2px] rounded-full bg-[#FFDDB8]/40 text-[#745939] text-[11px] font-semibold leading-[14px] tracking-[0.05em] uppercase font-sans">
                  REQUIRED
                </span>
              </div>

              {/* Input: Book Title (Figma #1:950 - #1:957) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm font-sans">
                  <label htmlFor="book-title" className="font-semibold text-[14px] leading-[20px] text-[#1A1C1B]">
                    Book Title <span className="text-[#BA1A1A] font-normal">*</span>
                  </label>
                  <span className="font-semibold text-[11px] leading-[14px] tracking-[0.05em] text-[#45474C]">
                    {formData.title.length} / 120 chars
                  </span>
                </div>
                <input
                  id="book-title"
                  name="title"
                  type="text"
                  required
                  maxLength={120}
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="The Architecture of Silence"
                  className={`w-full px-4 py-2.5 rounded-lg bg-[#F4F3F1] border ${
                    formErrors.title ? 'border-error ring-1 ring-error' : 'border-transparent'
                  } text-sm text-[#1A1C1B] placeholder:text-[#45474C]/50 focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans`}
                />
                {formErrors.title && (
                  <p className="text-xs text-error font-sans">{formErrors.title}</p>
                )}
              </div>

              {/* Row 1: Primary Author & Published Year (Figma #1:958 - #1:978) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Author Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="book-author" className="font-semibold text-[14px] leading-[20px] text-[#1A1C1B] font-sans">
                    Primary Author <span className="text-[#BA1A1A] font-normal">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="book-author"
                      name="author"
                      required
                      value={formData.author}
                      onChange={handleChange}
                      disabled={loadingAuthors}
                      className={`w-full pl-4 pr-10 py-2.5 rounded-lg bg-[#F4F3F1] border ${
                        formErrors.author ? 'border-error' : 'border-transparent'
                      } text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all appearance-none cursor-pointer font-sans`}
                    >
                      <option value="" disabled>
                        {loadingAuthors ? 'Loading archival authors...' : 'Select an author'}
                      </option>
                      {authors.map((a) => (
                        <option key={a._id} value={a._id}>
                          {a.name} ({a.nationality || 'Archived'})
                        </option>
                      ))}
                    </select>
                    <svg className="w-[10px] h-[7px] text-[#45474C] fill-current absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 10 7">
                      <path d="M5 6.16667L0 1.16667L1.16667 0L5 3.83333L8.83333 0L10 1.16667L5 6.16667Z" />
                    </svg>
                  </div>
                  {formErrors.author && (
                    <p className="text-xs text-error font-sans">{formErrors.author}</p>
                  )}
                </div>

                {/* Published Year */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="book-year" className="font-semibold text-[14px] leading-[20px] text-[#1A1C1B] font-sans">
                    Published Year <span className="text-[#BA1A1A] font-normal">*</span>
                  </label>
                  <input
                    id="book-year"
                    name="publishedYear"
                    type="number"
                    min="1"
                    max={new Date().getFullYear()}
                    required
                    value={formData.publishedYear}
                    onChange={handleChange}
                    placeholder="2023"
                    className={`w-full px-3 py-2.5 rounded-lg bg-[#F4F3F1] border ${
                      formErrors.publishedYear ? 'border-error' : 'border-transparent'
                    } text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans`}
                  />
                  {formErrors.publishedYear && (
                    <p className="text-xs text-error font-sans">{formErrors.publishedYear}</p>
                  )}
                </div>
              </div>

              {/* Row 2: Genre & Price (Figma #1:979 - #1:1009) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Genre Select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="book-genre" className="font-semibold text-[14px] leading-[20px] text-[#1A1C1B] font-sans">
                    Genre <span className="text-[#BA1A1A] font-normal">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="book-genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-[#F4F3F1] border border-transparent text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all appearance-none cursor-pointer font-sans"
                    >
                      {GENRE_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                    <svg className="w-[10px] h-[7px] text-[#45474C] fill-current absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 10 7">
                      <path d="M5 6.16667L0 1.16667L1.16667 0L5 3.83333L8.83333 0L10 1.16667L5 6.16667Z" />
                    </svg>
                  </div>
                </div>

                {/* Price (USD) */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="book-price" className="font-semibold text-[14px] leading-[20px] text-[#1A1C1B] font-sans">
                    Price <span className="text-[#BA1A1A] font-normal">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474C] font-semibold text-sm">
                      $
                    </span>
                    <input
                      id="book-price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="34.50"
                      className={`w-full pl-8 pr-16 py-2.5 rounded-lg bg-[#F4F3F1] border ${
                        formErrors.price ? 'border-error' : 'border-transparent'
                      } text-sm text-[#1A1C1B] focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans font-normal`}
                    />
                    <span className="absolute right-3 font-label-sm text-label-sm text-[#45474C] bg-[#E9E8E6] px-2 py-0.5 rounded">
                      USD
                    </span>
                  </div>
                  {formErrors.price && (
                    <p className="text-xs text-error font-sans">{formErrors.price}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 2: Synopsis & Rich Editorial Note (Figma #1:1002 - #1:1051) */}
            <RichTextEditor
              value={formData.description}
              onChange={handleDescriptionChange}
              error={formErrors.description}
              initialLoading={initialLoading}
              wordCount={wordCount}
              charCount={charCount}
              maxChars={MAX_DESCRIPTION_CHARS}
            />
          </div>

          {/* RIGHT 4 COLUMNS: PHYSICAL SIMULATION & CLOUDINARY UPLOAD (Figma #1:1052) */}
          <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8">
            {/* Live 3D Physical Book Simulation (Figma #1:1053 - #1:1076) */}
            <BookLivePreviewCard
              formData={formData}
              selectedAuthor={selectedAuthor}
            />

            {/* Cover Source & Drag-Drop Box (Figma #1:1078 - #1:1089) */}
            <CoverUploadDropzone
              coverImage={formData.coverImage}
              onChange={handleChange}
              onFileUpload={handleFileUpload}
              uploadingCover={uploadingCover}
              error={formErrors.coverImage}
            />
          </div>
        </div>

        {/* FORM ACTION FOOTER: CANCEL & SAVE ACTIONS (Figma #1:1090 - #1:1109) */}
        <div className="bg-white p-4 sm:p-6 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          {/* Left Validation Readiness Indicator (Figma #1:1092 - #1:1098) */}
          <div className="flex items-center gap-3">
            <span className="w-[10px] h-[10px] rounded-full bg-[#745939] shrink-0" />
            <div>
              <p className="font-sans font-semibold text-[13px] sm:text-[14px] leading-[20px] text-[#1A1C1B]">
                Ready to Catalog
              </p>
              <p className="font-sans font-normal text-[12px] leading-[18px] text-[#45474C] hidden sm:block">
                All mandatory bibliographic identifiers provided.
              </p>
            </div>
          </div>

          {/* Right Action CTAs: Cancel & Save (Figma #1:1100 - #1:1109) */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial justify-center px-4 sm:px-5 py-2.5 rounded-lg border border-[#C5C6CD] hover:bg-[#F4F3F1] text-xs sm:text-sm font-semibold text-[#1A1C1B] transition-colors flex items-center gap-2 font-sans cursor-pointer"
            >
              <svg className="w-[11px] h-[11px] text-[#1A1C1B] fill-current" viewBox="0 0 11 11">
                <path d="M1.1 11L0 9.9L4.4 5.5L0 1.1L1.1 0L5.5 4.4L9.9 0L11 1.1L6.6 5.5L11 9.9L9.9 11L5.5 6.6L1.1 11Z" />
              </svg>
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting || uploadingCover}
              className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-2.5 rounded-lg bg-[#091426] hover:bg-[#091426]/90 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 font-sans disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-[15px] h-[15px] text-white fill-current" viewBox="0 0 15 15">
                    <path d="M6.45 10.95L11.7375 5.6625L10.6875 4.6125L6.45 8.85L4.3125 6.7125L3.2625 7.7625L6.45 10.95ZM7.5 15C6.4625 15 5.4875 14.8031 4.575 14.4094C3.6625 14.0156 2.86875 13.4812 2.19375 12.8062C1.51875 12.1312 0.984375 11.3375 0.590625 10.425C0.196875 9.5125 0 8.5375 0 7.5C0 6.4625 0.196875 5.4875 0.590625 4.575C0.984375 3.6625 1.51875 2.86875 2.19375 2.19375C2.86875 1.51875 3.6625 0.984375 4.575 0.590625C5.4875 0.196875 6.4625 0 7.5 0C8.5375 0 9.5125 0.196875 10.425 0.590625C11.3375 0.984375 12.1312 1.51875 12.8062 2.19375C13.4812 2.86875 14.0156 3.6625 14.4094 4.575C14.8031 5.4875 15 6.4625 15 7.5C15 8.5375 14.8031 9.5125 14.4094 10.425C14.0156 11.3375 13.4812 12.1312 12.8062 12.8062C12.1312 13.4812 11.3375 14.0156 10.425 14.4094C9.5125 14.8031 8.5375 15 7.5 15ZM7.5 13.5C9.175 13.5 10.5938 12.9188 11.7563 11.7563C12.9188 10.5938 13.5 9.175 13.5 7.5C13.5 5.825 12.9188 4.40625 11.7563 3.24375C10.5938 2.08125 9.175 1.5 7.5 1.5C5.825 1.5 4.40625 2.08125 3.24375 3.24375C2.08125 4.40625 1.5 5.825 1.5 7.5C1.5 9.175 2.08125 10.5938 3.24375 11.7563C4.40625 12.9188 5.825 13.5 7.5 13.5Z" />
                  </svg>
                  <span>{isEdit ? 'Update Book' : 'Save Book'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
